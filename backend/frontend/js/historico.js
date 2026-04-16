const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://planneremocional-production.up.railway.app";

const btnVoltarCheckin = document.getElementById("btnVoltarCheckin");
const btnMesAnterior = document.getElementById("btnMesAnterior");
const btnMesProximo = document.getElementById("btnMesProximo");
const mesAnoAtualEl = document.getElementById("mesAnoAtual");
const calendarioGrid = document.getElementById("calendarioGrid");
const legendaGrid = document.getElementById("legendaGrid");
const historicoVazio = document.getElementById("historicoVazio");
const detalheDiaSection = document.getElementById("detalheDiaSection");
const detalheDiaConteudo = document.getElementById("detalheDiaConteudo");
const boasVindasHistorico = document.getElementById("boasVindasHistorico");

const nomesMeses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const MAPA_EMOCIONAL = {
  ESTAVEL: { label: "Estável", cor: "#f3c7c7" },
  SENSIVEL: { label: "Sensível", cor: "#f4d8ea" },
  REATIVA: { label: "Reativo(a)", cor: "#f6b8b0" },
  ACOLHEDORA: { label: "Acolhedor(a)", cor: "#cfe7d9" },
  DEFENSIVA: { label: "Defensivo(a)", cor: "#c9d8f4" },
  VULNERAVEL: { label: "Vulnerável", cor: "#dcccf0" },
  INSENSIVEL: { label: "Insensível", cor: "#cbc6e9" },
};

const LABELS = {
  energia_fisica: {
    ENERGIZADO: "⚡ Energizado",
    CANSADO: "😮‍💨 Cansado",
    EXAUSTO: "🥱 Exausto",
    LEVE: "🍃 Leve",
    PESADO: "🪨 Pesado",
    TENSO: "🧱 Tenso",
    RELAXADO: "🧘 Relaxado",
  },
  energia_mental: {
    CLARA: "🔎 Clara",
    CONFUSA: "🌀 Confusa",
    ACELERADA: "⚡ Acelerada",
    DISPERSA: "🎈 Dispersa",
    FOCADA: "🎯 Focada",
    SOBRECARREGADA: "🧯 Sobrecarregada",
    CRIATIVA: "💡 Criativa",
  },
  energia_emocional: {
    ESTAVEL: "⚖️ Estável",
    SENSIVEL: "🌸 Sensível",
    REATIVA: "🔥 Reativo(a)",
    ACOLHEDORA: "🤲 Acolhedor(a)",
    DEFENSIVA: "🛡️ Defensivo(a)",
    VULNERAVEL: "🫶 Vulnerável",
    INSENSIVEL: "🧊 Insensível",
  },
  energia_espiritual: {
    CONECTADA: "🔗 Conectado(a)",
    DESCONECTADA: "📴 Desconectado(a)",
    EM_PAZ: "🕊️ Em paz",
    EM_CONFLITO: "⚔️ Em conflito",
    CONFIANTE: "🛐 Confiante",
    VAZIA: "🫙 Vazio(a)",
    ESPERANCOSA: "🌟 Esperançoso(a)",
  },
  energia_social: {
    ABERTA: "🌞 Aberto(a)",
    FECHADA: "🌙 Fechado(a)",
    CONECTADA: "🤝 Conectado(a)",
    ISOLADA: "🏝️ Isolado(a)",
    RECEPTIVA: "📩 Receptivo(a)",
    IRRITAVEL: "🌋 Irritável",
    PROTETIVA: "🛡️ Protetivo(a)",
  },
};

let dataNavegacao = new Date();
let registrosDoMes = [];
let mapaPorData = {};

document.addEventListener("DOMContentLoaded", () => {
  aplicarBoasVindas();
  renderizarLegenda();
  configurarEventos();
  carregarHistoricoDoMes();
});

function getUsuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function aplicarBoasVindas() {
  const user = getUsuarioLogado();

  if (!user?.id) {
    window.location.href = "/login";
    return;
  }

  const primeiroNome = String(user.nome || "").trim().split(" ")[0] || "usuária";
  if (boasVindasHistorico) {
    boasVindasHistorico.textContent = `✨ ${primeiroNome}, acompanhe seus registros ✨`;
  }
}

function configurarEventos() {
  btnVoltarCheckin?.addEventListener("click", () => {
    window.location.href = "/checkin";
  });

  btnMesAnterior?.addEventListener("click", () => {
    dataNavegacao.setMonth(dataNavegacao.getMonth() - 1);
    carregarHistoricoDoMes();
  });

  btnMesProximo?.addEventListener("click", () => {
    dataNavegacao.setMonth(dataNavegacao.getMonth() + 1);
    carregarHistoricoDoMes();
  });
}

function renderizarLegenda() {
  legendaGrid.innerHTML = "";

  Object.entries(MAPA_EMOCIONAL).forEach(([chave, item]) => {
    const div = document.createElement("div");
    div.className = "legend-item";
    div.innerHTML = `
      <span class="legend-color" style="background:${item.cor}"></span>
      <span>${item.label}</span>
    `;
    legendaGrid.appendChild(div);
  });
}

async function carregarHistoricoDoMes() {
  const user = getUsuarioLogado();

  if (!user?.id) {
    window.location.href = "/login";
    return;
  }

  const mes = dataNavegacao.getMonth() + 1;
  const ano = dataNavegacao.getFullYear();

  mesAnoAtualEl.textContent = `${nomesMeses[mes - 1]} ${ano}`;
  historicoVazio.classList.add("hidden");
  detalheDiaSection.classList.add("hidden");
  detalheDiaConteudo.innerHTML = "";

  try {
    const response = await fetch(
      `${API_BASE_URL}/checkins/historico?login_id=${user.id}&mes=${mes}&ano=${ano}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.erro || "Erro ao buscar histórico");
    }

    registrosDoMes = Array.isArray(data) ? data : [];
    mapaPorData = {};

    registrosDoMes.forEach((registro) => {
      const chave = normalizarDataISO(registro.data_checkin);
      mapaPorData[chave] = registro;
    });

    renderizarCalendario();

    if (registrosDoMes.length === 0) {
      historicoVazio.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Erro ao carregar histórico:", error);
    registrosDoMes = [];
    mapaPorData = {};
    renderizarCalendario();
    historicoVazio.classList.remove("hidden");
    historicoVazio.innerHTML = "<p>Não foi possível carregar o histórico deste mês.</p>";
  }
}

function renderizarCalendario() {
  calendarioGrid.innerHTML = "";

  const ano = dataNavegacao.getFullYear();
  const mes = dataNavegacao.getMonth();

  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const totalDiasNoMes = new Date(ano, mes + 1, 0).getDate();

  for (let i = 0; i < primeiroDiaSemana; i++) {
    const celulaVazia = document.createElement("div");
    celulaVazia.className = "calendar-cell";
    celulaVazia.innerHTML = `<div class="calendar-empty"></div>`;
    calendarioGrid.appendChild(celulaVazia);
  }

  for (let dia = 1; dia <= totalDiasNoMes; dia++) {
    const chaveData = formatarChaveData(ano, mes + 1, dia);
    const registro = mapaPorData[chaveData];

    const celula = document.createElement("div");
    celula.className = "calendar-cell";

    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "calendar-day";
    botao.textContent = dia;

    if (registro) {
      botao.classList.add("com-registro");
      botao.style.background = corDoRegistro(registro);
    } else {
      botao.classList.add("sem-registro");
    }

    if (ehHoje(dia, mes, ano)) {
      botao.classList.add("hoje");
    }

    botao.addEventListener("click", () => {
      document.querySelectorAll(".calendar-day").forEach((item) => {
        item.classList.remove("selecionado");
      });

      botao.classList.add("selecionado");
      renderizarDetalheDia(chaveData, registro);
    });

    celula.appendChild(botao);
    calendarioGrid.appendChild(celula);
  }
}

function renderizarDetalheDia(chaveData, registro) {
  detalheDiaSection.classList.remove("hidden");

  if (!registro) {
    detalheDiaConteudo.innerHTML = `
      <div class="row">
        <span class="k">📅 Data</span>
        <span class="v">${formatarDataVisual(chaveData)}</span>
      </div>
      <div class="row">
        <span class="k">Registro</span>
        <span class="v">Nenhum check-in registrado neste dia.</span>
      </div>
    `;
    return;
  }

  detalheDiaConteudo.innerHTML = `
    ${linhaDetalhe("📅 Data", formatarDataVisual(chaveData))}
    ${linhaDetalhe("⏰ Horário", registro.horario_registro_local || "—")}
    ${linhaDetalhe("🔋 Energia Física", labelFrom("energia_fisica", registro.energia_fisica))}
    ${linhaDetalhe("🧠 Energia Mental", labelFrom("energia_mental", registro.energia_mental))}
    ${linhaDetalhe("❤️ Energia Emocional", labelFrom("energia_emocional", registro.energia_emocional))}
    ${linhaDetalhe("🌱 Energia Espiritual", labelFrom("energia_espiritual", registro.energia_espiritual))}
    ${linhaDetalhe("🧍 Energia Social", labelFrom("energia_social", registro.energia_social))}
    ${linhaDetalhe("💭 O que ocupou minha mente", registro.ocupou_mente || "—")}
    ${linhaDetalhe("🧠 O que mais me afetou hoje?", registro.afetou_hoje || "—")}
    ${linhaDetalhe("🌱 Algo simples que posso fazer por mim", registro.autocuidado || "—")}
    ${linhaDetalhe("✍️ Observações livres", registro.observacoes_livres || "—")}
    ${linhaDetalhe("🏆 Pequena vitória", registro.pequena_vitoria || "—")}
  `;
}

function linhaDetalhe(chave, valor) {
  return `
    <div class="row">
      <span class="k">${escapeHtml(chave)}</span>
      <span class="v">${escapeHtml(valor)}</span>
    </div>
  `;
}

function corDoRegistro(registro) {
  const chave = String(registro.energia_emocional || "").trim().toUpperCase();
  return MAPA_EMOCIONAL[chave]?.cor || "#e5def0";
}

function labelFrom(field, rawValue) {
  if (!rawValue) return "—";
  const key = String(rawValue).trim().toUpperCase();
  return LABELS?.[field]?.[key] ?? key;
}

function normalizarDataISO(data) {
  if (!data) return "";
  return String(data).slice(0, 10);
}

function formatarChaveData(ano, mes, dia) {
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function formatarDataVisual(chave) {
  const [ano, mes, dia] = chave.split("-");
  return `${dia}/${mes}/${ano}`;
}

function ehHoje(dia, mes, ano) {
  const hoje = new Date();
  return hoje.getDate() === dia &&
    hoje.getMonth() === mes &&
    hoje.getFullYear() === ano;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}