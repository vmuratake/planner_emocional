const checkinService = require("../services/checkin.service");

const COMO_ME_SINTO = [
  "FELIZ",
  "TRISTE",
  "PREOCUPADO",
  "ANSIOSO",
  "CALMO",
  "DESPREOCUPADO",
  "IRRITADO",
  "GRATO",
  "APAIXONADO",
  "OTIMISTA",
  "ESPERANCOSO",
  "REALIZADO",
  "FRUSTRADO",
  "CULPADO",
  "ANGUSTIADO",
  "NOSTALGICO"
];
const ENERGIA_FISICA = ["ENERGIZADO", "CANSADO", "EXAUSTO", "LEVE", "PESADO", "TENSO", "RELAXADO"];
const ENERGIA_MENTAL = ["CLARA", "CONFUSA", "ACELERADA", "DISPERSA", "FOCADA", "SOBRECARREGADA", "CRIATIVA"];


// Função auxiliar para validar campos de energia, permitindo valores nulos ou vazios, mas garantindo que valores preenchidos sejam válidos
function validarSePreenchido(valor, dominio, campo) {
  if (valor == null || String(valor).trim() === "") return null;
  if (!dominio.includes(valor)) return { erro: `${campo} inválido` };
  return valor;
}

// Listagem de check-ins, garantindo que o login_id seja fornecido e tratando erros de forma consistente
async function listar(req, res) {
  try {
    const { login_id } = req.query;

    if (!login_id) {
      return res.status(400).json({ erro: "login_id obrigatório" });
    }

    const rows = await checkinService.listarCheckins(login_id);
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Erro ao listar registros:", error.message);
    return res.status(500).json({ erro: "Erro interno ao listar registros" });
  }
}

// Busca de check-in por data, garantindo que o registro pertence ao usuário e tratando casos de não encontrado ou falta de login_id
async function buscarByDate(req, res) {
  try {
    const { data } = req.params;
    const { login_id } = req.query;

    if (!login_id) {
      return res.status(400).json({ erro: "login_id obrigatório" });
    }

    const row = await checkinService.buscarPorData(data, login_id);

    if (!row) {
      return res.status(404).json({ erro: "Não existe registro para essa data" });
    }

    return res.status(200).json(row);
  } catch (error) {
    console.error("Erro ao buscar registro por data:", error.message);
    return res.status(500).json({ erro: "Erro interno ao buscar registro por data" });
  }
}

// Criação de check-in, com validação de campos obrigatórios e valores de energia
async function criar(req, res) {
  try {
    const body = req.body;

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
    } = body;

    if (!data_checkin || !como_me_sinto || !energia_fisica || !energia_mental || !login_id) {
      return res.status(400).json({
        erro: "Campos obrigatórios: data_checkin, como_me_sinto, energia_fisica, energia_mental, login_id",
      });
    }

    const vComoMeSinto = validarSePreenchido(como_me_sinto, COMO_ME_SINTO, "como_me_sinto");
    if (vComoMeSinto?.erro) return res.status(400).json(vComoMeSinto);

    const vFisica = validarSePreenchido(energia_fisica, ENERGIA_FISICA, "energia_fisica");
    if (vFisica?.erro) return res.status(400).json(vFisica);

    const vMental = validarSePreenchido(energia_mental, ENERGIA_MENTAL, "energia_mental");
    if (vMental?.erro) return res.status(400).json(vMental);



    if (horario_registro_local && !/^\d{2}:\d{2}$/.test(horario_registro_local)) {
      return res.status(400).json({ erro: "horario_registro_local inválido (use HH:MM)" });
    }

    const id = await checkinService.criarCheckin({
      login_id,
      data_checkin,
      como_me_sinto: vComoMeSinto,
      energia_fisica: vFisica,
      energia_mental: vMental,
      me_conte_seu_dia,
      aprendizados_hoje,
      observacoes_livres,
      horario_registro_local,
    });

    return res.status(201).json({ mensagem: "Registro criado com sucesso", id });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ erro: "Você já possui um registro para essa data" });
    }

    if (error.code === "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD" || error.code === "WARN_DATA_TRUNCATED") {
      return res.status(400).json({ erro: "Valor inválido em algum campo de energia" });
    }

    console.error("Erro ao criar registro:", error.message);
    return res.status(500).json({ erro: "Erro interno ao criar registro" });
  }
}

// Exclusão de check-in por ID, garantindo que o registro pertence ao usuário
async function excluir(req, res) {
  try {
    const { id } = req.params;
    const { login_id } = req.query;

    if (!id || !login_id) {
      return res.status(400).json({
        erro: "Parâmetros obrigatórios: id e login_id",
      });
    }

    const result = await checkinService.excluirCheckin(id, login_id);

    if (!result.deleted) {
      return res.status(404).json({
        erro: "Registro não encontrado para este usuário",
      });
    }

    return res.status(200).json({
      mensagem: "Registro excluído com sucesso",
    });
  } catch (error) {
    console.error("Erro ao excluir registro:", error.message);
    return res.status(500).json({
      erro: "Erro interno ao excluir registro",
    });
  }
}

// Busca de histórico de check-ins por mês e ano, garantindo que o login_id seja fornecido e tratando erros de forma consistente
async function buscarHistorico(req, res) {
  try {
    const { login_id, mes, ano } = req.query;

    if (!login_id || !mes || !ano) {
      return res.status(400).json({
        erro: "login_id, mes e ano são obrigatórios."
      });
    }

    const historico = await checkinService.buscarHistoricoPorMes({
      login_id: Number(login_id),
      mes: Number(mes),
      ano: Number(ano)
    });

    return res.status(200).json(historico);
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return res.status(500).json({
      erro: "Erro interno ao buscar histórico.",
      detalhe: error.message
    });
  }
}

module.exports = { listar, buscarByDate, criar, excluir, buscarHistorico };