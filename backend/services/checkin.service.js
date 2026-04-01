const { pool } = require("../db");

async function listarCheckins(login_id) {

  console.log("LOGIN_ID NO SERVICE:", login_id);
  const sql = `
    SELECT
      id,
      login_id,
      data_checkin,
      energia_fisica,
      energia_mental,
      energia_emocional,
      energia_espiritual,
      energia_social,
      ocupou_mente,
      afetou_hoje,
      autocuidado,
      observacoes_livres,
      pequena_vitoria,
      horario_registro_local,
      created_at
    FROM tbcheckin
    WHERE login_id = ?
    ORDER BY data_checkin DESC, id DESC
  `;
  const [rows] = await pool.query(sql, [login_id]);
  console.log("ROWS LISTAR:", rows);
  return rows;
}

async function buscarPorData(data, login_id) {
  const sql = `
    SELECT
      id,
      login_id,
      data_checkin,
      energia_fisica,
      energia_mental,
      energia_emocional,
      energia_espiritual,
      energia_social,
      ocupou_mente,
      afetou_hoje,
      autocuidado,
      observacoes_livres,
      pequena_vitoria,
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

async function criarCheckin(payload) {
  const {
    login_id,
    data_checkin,
    energia_fisica,
    energia_mental,
    energia_emocional,
    energia_espiritual,
    energia_social,
    ocupou_mente,
    afetou_hoje,
    autocuidado,
    observacoes_livres,
    pequena_vitoria,
    horario_registro_local,
  } = payload;

  const sql = `
    INSERT INTO tbcheckin
    (
      login_id,
      data_checkin,
      energia_fisica,
      energia_mental,
      energia_emocional,
      energia_espiritual,
      energia_social,
      ocupou_mente,
      afetou_hoje,
      autocuidado,
      observacoes_livres,
      pequena_vitoria,
      horario_registro_local
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const valores = [
    login_id,
    data_checkin,
    energia_fisica,
    energia_mental,
    energia_emocional,
    energia_espiritual,
    energia_social,
    (ocupou_mente == null || String(ocupou_mente).trim() === "") ? null : ocupou_mente,
    (afetou_hoje == null || String(afetou_hoje).trim() === "") ? null : afetou_hoje,
    (autocuidado == null || String(autocuidado).trim() === "") ? null : autocuidado,
    (observacoes_livres == null || String(observacoes_livres).trim() === "") ? null : observacoes_livres,
    (pequena_vitoria == null || String(pequena_vitoria).trim() === "") ? null : pequena_vitoria,
    horario_registro_local,
  ];

  const [result] = await pool.query(sql, valores);
  return result.insertId;
}

async function excluirCheckin(id, login_id) {
  const sql = `
    DELETE FROM tbcheckin
    WHERE id = ? AND login_id = ?
  `;

  const [result] = await pool.query(sql, [id, login_id]);
  return { deleted: result.affectedRows > 0 };
}

module.exports = {
  listarCheckins,
  buscarPorData,
  criarCheckin,
  excluirCheckin,
};