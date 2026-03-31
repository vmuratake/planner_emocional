
const checkinService = require("../services/checkin.service");

const ENERGIA_FISICA = ["ENERGIZADO", "CANSADO", "EXAUSTO", "LEVE", "PESADO", "TENSO", "RELAXADO"];
const ENERGIA_MENTAL = ["CLARA", "CONFUSA", "ACELERADA", "DISPERSA", "FOCADA", "SOBRECARREGADA", "CRIATIVA"];
const ENERGIA_EMOCIONAL = ["ESTAVEL", "SENSIVEL", "REATIVA", "ACOLHEDORA", "DEFENSIVA", "VULNERAVEL", "INSENSIVEL"];
const ENERGIA_ESPIRITUAL = ["CONECTADA", "DESCONECTADA", "EM_PAZ", "EM_CONFLITO", "CONFIANTE", "VAZIA", "ESPERANCOSA"];
const ENERGIA_SOCIAL = ["ABERTA", "FECHADA", "CONECTADA", "ISOLADA", "RECEPTIVA", "IRRITAVEL", "PROTETIVA"];

function validarSePreenchido(valor, dominio, campo) {
  if (valor == null || String(valor).trim() === "") return null;
  if (!dominio.includes(valor)) return { erro: `${campo} inválido` };
  return valor;
}

async function listar(req, res) {
  try {
    const login_id = req.query.login_id;

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

async function buscarByDate(req, res) {
  try {
    const { data } = req.params;
    const row = await checkinService.buscarPorData(data);

    if (!row) return res.status(404).json({ erro: "Não existe registro para essa data" });
    return res.status(200).json(row);
  } catch (error) {
    console.error("Erro ao buscar registro por data:", error.message);
    return res.status(500).json({ erro: "Erro interno ao buscar registro por data" });
  }
}

async function criar(req, res) {
  try {
    const body = req.body;

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
    } = body;

    if (!data_checkin || !energia_fisica || !energia_mental || !energia_emocional || !energia_espiritual || !energia_social || !login_id) {
      return res.status(400).json({
        erro: "Campos obrigatórios: data_checkin, energia_fisica, energia_mental, energia_emocional, energia_espiritual, energia_social, login_id",
      });
    }

    const vFisica = validarSePreenchido(energia_fisica, ENERGIA_FISICA, "energia_fisica");
    if (vFisica?.erro) return res.status(400).json(vFisica);

    const vMental = validarSePreenchido(energia_mental, ENERGIA_MENTAL, "energia_mental");
    if (vMental?.erro) return res.status(400).json(vMental);

    const vEmocional = validarSePreenchido(energia_emocional, ENERGIA_EMOCIONAL, "energia_emocional");
    if (vEmocional?.erro) return res.status(400).json(vEmocional);

    const vEspiritual = validarSePreenchido(energia_espiritual, ENERGIA_ESPIRITUAL, "energia_espiritual");
    if (vEspiritual?.erro) return res.status(400).json(vEspiritual);

    const vSocial = validarSePreenchido(energia_social, ENERGIA_SOCIAL, "energia_social");
    if (vSocial?.erro) return res.status(400).json(vSocial);

    if (horario_registro_local && !/^\d{2}:\d{2}$/.test(horario_registro_local)) {
      return res.status(400).json({ erro: "horario_registro_local inválido (use HH:MM)" });
    }

    const id = await checkinService.criarCheckin({
      login_id,
      data_checkin,
      energia_fisica: vFisica,
      energia_mental: vMental,
      energia_emocional: vEmocional,
      energia_espiritual: vEspiritual,
      energia_social: vSocial,
      ocupou_mente,
      afetou_hoje,
      autocuidado,
      observacoes_livres,
      pequena_vitoria,
      horario_registro_local,
    });

    return res.status(201).json({ mensagem: "Registro criado com sucesso", id });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ erro: "Já existe registro para essa data" });

    if (error.code === "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD" || error.code === "WARN_DATA_TRUNCATED") {
      return res.status(400).json({ erro: "Valor inválido em algum campo de energia" });
    }

    console.error("Erro ao criar registro:", error.message);
    return res.status(500).json({ erro: "Erro interno ao criar registro" });
  }
}

module.exports = { listar, buscarByDate, criar };