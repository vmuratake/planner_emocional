const { pool } = require("../db");
const bcrypt = require("bcrypt");

// Serviço de check-in, responsável por interagir com o banco de dados e realizar operações relacionadas aos check-ins dos usuários
async function listarCheckins(login_id) {
  const sql = `
SELECT
  id,
  login_id,
  data_checkin,
  como_me_sinto,
  energia_fisica,
  energia_mental,
  me_conte_seu_dia,
  aprendizados_hoje,
  observacoes_livres,
  horario_registro_local,
  created_at
FROM tbcheckin
    WHERE login_id = ?
    ORDER BY data_checkin DESC, id DESC
  `;
  const [rows] = await pool.query(sql, [login_id]);
  return rows;
}

// Busca de check-in por data, garantindo que o registro pertence ao usuário e tratando casos de não encontrado ou falta de login_id
async function buscarPorData(data, login_id) {
  const sql = `
    SELECT
      id,
      login_id,
      data_checkin,
      como_me_sinto,
      energia_fisica,
      energia_mental,
      me_conte_seu_dia,
      aprendizados_hoje,
      observacoes_livres,
      horario_registro_local,
      created_at
    FROM tbcheckin
    WHERE data_checkin = ? AND login_id = ?
    ORDER BY id DESC
    LIMIT 1
  `;
  const [rows] = await pool.query(sql, [data, login_id]);
  return rows[0] || null;
}

// Criação de check-in, com validação de campos obrigatórios e valores de energia
async function criarCheckin(payload) {
  const {
    login_id,
    data_checkin,
    como_me_sinto,
    energia_fisica,
    energia_mental,
    me_conte_seu_dia,
    aprendizados_hoje,
    observacoes_livres,
    horario_registro_local,
  } = payload;

  const sql = `
    INSERT INTO tbcheckin
    (
      login_id,
      data_checkin,
      como_me_sinto,
      energia_fisica,
      energia_mental,
      me_conte_seu_dia,
      aprendizados_hoje,
      observacoes_livres,
      horario_registro_local
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const valores = [
    login_id,
    data_checkin,
    como_me_sinto,
    energia_fisica,
    energia_mental,
    (me_conte_seu_dia == null || String(me_conte_seu_dia).trim() === "") ? null : me_conte_seu_dia,
    (aprendizados_hoje == null || String(aprendizados_hoje).trim() === "") ? null : aprendizados_hoje,
    (observacoes_livres == null || String(observacoes_livres).trim() === "") ? null : observacoes_livres,
    horario_registro_local,
  ];

  const [result] = await pool.query(sql, valores);
  return result.insertId;
}


// Exclusão de check-in por ID, garantindo que o registro pertence ao usuário
async function excluirCheckin(id, login_id) {
  const sql = `
    DELETE FROM tbcheckin
    WHERE id = ? AND login_id = ?
  `;

  const [result] = await pool.query(sql, [id, login_id]);
  return { deleted: result.affectedRows > 0 };
}

// Busca de histórico de check-ins por mês, garantindo que os registros pertencem ao usuário e ordenando por data e ID
async function buscarHistoricoPorMes({ login_id, mes, ano }) {
  const dataInicial = `${ano}-${String(mes).padStart(2, "0")}-01`;

  const proximoMes = mes === 12 ? 1 : mes + 1;
  const proximoAno = mes === 12 ? ano + 1 : ano;
  const dataFinal = `${proximoAno}-${String(proximoMes).padStart(2, "0")}-01`;

  const sql = `
    SELECT
      id,
      login_id,
      data_checkin,
      horario_registro_local,
      como_me_sinto,
      energia_fisica,
      energia_mental,
      me_conte_seu_dia,
      aprendizados_hoje,
      observacoes_livres,
      created_at
    FROM tbcheckin
    WHERE login_id = ?
      AND data_checkin >= ?
      AND data_checkin < ?
    ORDER BY data_checkin ASC, id ASC
    `;

  const [rows] = await pool.query(sql, [login_id, dataInicial, dataFinal]);
  return rows;
}


module.exports = {
  listarCheckins,
  buscarPorData,
  criarCheckin,
  excluirCheckin,
  buscarHistoricoPorMes,
};