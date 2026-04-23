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
  // ❤️ EMOÇÕES MAIS VIVAS
  FELIZ: { label: "Feliz", cor: "#f4a9a0" },
  IRRITADO: { label: "Irritado(a)", cor: "#e57373" },
  APAIXONADO: { label: "Apaixonado(a)", cor: "#ec8fb5" },

  // 💜 GRUPO ANSIEDADE / INTROSPECTIVO (AGORA DIFERENCIADO)
  TRISTE: { label: "Triste", cor: "#d4c6f0" },        // lilás claro
  ANSIOSO: { label: "Ansioso(a)", cor: "#b39ddb" },   // roxo médio
  ANGUSTIADO: { label: "Angustiado(a)", cor: "#9575cd" }, // roxo mais forte
  CULPADO: { label: "Culpado(a)", cor: "#b0a4c9" },   // roxo acinzentado

  // 🟡 CALMA / POSITIVO (AGORA NÃO IGUAL)
  CALMO: { label: "Calmo(a)", cor: "#f3e5ab" },       // amarelo suave
  GRATO: { label: "Grato(a)", cor: "#f6c177" },       // dourado
  OTIMISTA: { label: "Otimista", cor: "#f4b942" },    // âmbar mais forte

  // 🤎 REFLEXIVO (SEPARADOS)
  PREOCUPADO: { label: "Preocupado(a)", cor: "#d7c2a3" }, // bege
  FRUSTRADO: { label: "Frustrado(a)", cor: "#caa6a6" },   // rosado queimado
  NOSTALGICO: { label: "Nostálgico(a)", cor: "#bfa88a" }, // sépia

  // 💚 POSITIVO EQUILIBRADO
  ESPERANCOSO: { label: "Esperançoso(a)", cor: "#c5e1a5" }, // verde claro
  DESPREOCUPADO: { label: "Despreocupado(a)", cor: "#aed9c9" }, // verde pastel
  REALIZADO: { label: "Realizado(a)", cor: "#81c7a5" }, // verde-água mais forte
};

const LABELS = {
  como_me_sinto: {
    FELIZ: "😊 Feliz",
    TRISTE: "😢 Triste",
    PREOCUPADO: "😟 Preocupado(a)",
    ANSIOSO: "😰 Ansioso(a)",
    CALMO: "😌 Calmo(a)",
    DESPREOCUPADO: "😎 Despreocupado(a)",
    IRRITADO: "😠 Irritado(a)",
    GRATO: "🙏 Grato(a)",
    APAIXONADO: "🥰 Apaixonado(a)",
    OTIMISTA: "✨ Otimista",
    ESPERANCOSO: "🌟 Esperançoso(a)",
    REALIZADO: "🏆 Realizado(a)",
    FRUSTRADO: "😞 Frustrado(a)",
    CULPADO: "😔 Culpado(a)",
    ANGUSTIADO: "😣 Angustiado(a)",
    NOSTALGICO: "🍂 Nostálgico(a)",
  },
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
    window.location.href = "/";
  });

  btnMesAnterior?.addEventListener("click", () => {
    dataNavegacao.setDate(1);
    dataNavegacao.setMonth(dataNavegacao.getMonth() - 1);
    carregarHistoricoDoMes();
  });

  btnMesProximo?.addEventListener("click", () => {
    dataNavegacao.setDate(1);
    dataNavegacao.setMonth(dataNavegacao.getMonth() + 1);
    carregarHistoricoDoMes();
  });
}

// Renderiza a legenda de emoções com base no MAPA_EMOCIONAL, garantindo que cada emoção tenha seu rótulo e cor correspondentes
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

// Força a reinicialização da animação CSS para que o efeito ocorra toda vez que renderizar o calendário
function animarCalendario() {
  calendarioGrid.classList.remove("is-animating");
  void calendarioGrid.offsetWidth;
  calendarioGrid.classList.add("is-animating");
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
    animarCalendario();

    if (registrosDoMes.length === 0) {
      historicoVazio.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Erro ao carregar histórico:", error);
    registrosDoMes = [];
    mapaPorData = {};
    renderizarCalendario();
    animarCalendario();
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

  // Preencher células vazias antes do primeiro dia do mês
  for (let i = 0; i < primeiroDiaSemana; i++) {
    const celulaVazia = document.createElement("div");
    celulaVazia.className = "calendar-cell";
    celulaVazia.innerHTML = `<div class="calendar-empty"></div>`;
    calendarioGrid.appendChild(celulaVazia);
  }

  // Preencher dias do mês
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

// Preencher células vazias após o último dia do mês para completar a grade. completa sempre até 42 células (6 semanas)
const totalCelulasAtuais = primeiroDiaSemana + totalDiasNoMes;
const celulasRestantes = 42 - totalCelulasAtuais;

for (let i = 0; i < celulasRestantes; i++) {
  const celulaVazia = document.createElement("div");
  celulaVazia.className = "calendar-cell";
  celulaVazia.innerHTML = `<div class="calendar-empty"></div>`;
  calendarioGrid.appendChild(celulaVazia);
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
    ${linhaDetalhe("😊 Como me sinto hoje?", labelFrom("como_me_sinto", registro.como_me_sinto))}
    ${linhaDetalhe("🔋 Energia Física", labelFrom("energia_fisica", registro.energia_fisica))}
    ${linhaDetalhe("🧠 Energia Mental", labelFrom("energia_mental", registro.energia_mental))}
    ${linhaDetalhe("📝 Me conte como foi seu dia", registro.me_conte_seu_dia || "—")}
    ${linhaDetalhe("💡 O que aprendi com os acontecimentos de hoje?", registro.aprendizados_hoje || "—")}
    ${linhaDetalhe("✍️ Observações livres", registro.observacoes_livres || "—")}
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
  const chave = String(registro.como_me_sinto || "").trim().toUpperCase();
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