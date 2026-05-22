const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://planneremocional-production.up.railway.app";

const totalRegistrosEl = document.getElementById("totalRegistros");
const diasBonsEl = document.getElementById("diasBons");
const diasRuinsEl = document.getElementById("diasRuins");
const emocaoFrequenteEl = document.getElementById("emocaoFrequente");
const textoInsightsEl = document.getElementById("textoInsights");
const dashboardVazio = document.getElementById("dashboardVazio");

const btnVoltarHistorico = document.getElementById("btnVoltarHistorico");
const btnFiltrarDashboard = document.getElementById("btnFiltrarDashboard");
const btnLimparFiltros = document.getElementById("btnLimparFiltros");
const dataInicioEl = document.getElementById("dataInicio");
const dataFimEl = document.getElementById("dataFim");

let registros = [];
let graficoLinhaInstance = null;
let graficoComparativoInstance = null;

const LABEL_EMOCOES = {
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
  NOSTALGICO: "🍂 Nostálgico(a)"
};

document.addEventListener("DOMContentLoaded", () => {
  configurarEventos();
  aplicarPeriodoPadrao();
  carregarDashboard();
});

function configurarEventos() {
  btnVoltarHistorico?.addEventListener("click", () => {
    window.location.href = "/historico";
  });

  btnFiltrarDashboard?.addEventListener("click", aplicarFiltro);

  btnLimparFiltros?.addEventListener("click", limparFiltro);
}

function aplicarFiltro() {
  carregarDashboard();
}

function limparFiltro() {
  dataInicioEl.value = "";
  dataFimEl.value = "";

  carregarDashboardSemFiltro();
}

function aplicarPeriodoPadrao() {
  const hoje = new Date();
  const seteDiasAtras = new Date();

  seteDiasAtras.setDate(hoje.getDate() - 6);

  dataInicioEl.value = formatarDataInput(seteDiasAtras);
  dataFimEl.value = formatarDataInput(hoje);
}

function getUsuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

async function carregarDashboard() {
  const user = getUsuarioLogado();

  if (!user?.id) {
    window.location.href = "/login";
    return;
  }

  try {
    let url = `${API_BASE_URL}/checkins/dashboard?login_id=${user.id}`;

    if (dataInicioEl?.value && dataFimEl?.value) {
      url += `&data_inicio=${dataInicioEl.value}&data_fim=${dataFimEl.value}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.erro || "Erro ao carregar dashboard");
    }

    registros = Array.isArray(data) ? data : [];

    renderizarDashboard();

  } catch (error) {
    console.error("Erro dashboard:", error);

    dashboardVazio.classList.remove("hidden");
    dashboardVazio.innerHTML = `
      <p>Não foi possível carregar os dados do dashboard.</p>
    `;
  }
}

async function carregarDashboardSemFiltro() {
  const user = getUsuarioLogado();

  if (!user?.id) {
    window.location.href = "/login";
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/checkins/dashboard?login_id=${user.id}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.erro || "Erro ao carregar dashboard");
    }

    registros = Array.isArray(data) ? data : [];

    renderizarDashboard();

  } catch (error) {
    console.error("Erro dashboard sem filtro:", error);

    dashboardVazio.classList.remove("hidden");
    dashboardVazio.innerHTML = `
      <p>Não foi possível carregar todos os dados do dashboard.</p>
    `;
  }
}

function renderizarDashboard() {
  dashboardVazio.classList.add("hidden");

  if (registros.length === 0) {
    limparDashboardVisual();
    dashboardVazio.classList.remove("hidden");
    return;
  }

  preencherCards();
  criarGraficoLinha();
  criarGraficoComparativo();
  gerarInsights();
}

function limparDashboardVisual() {
  totalRegistrosEl.textContent = "0";
  diasBonsEl.textContent = "0";
  diasRuinsEl.textContent = "0";
  emocaoFrequenteEl.textContent = "—";
  textoInsightsEl.textContent = "Nenhum dado encontrado para o período selecionado.";

  if (graficoLinhaInstance) {
    graficoLinhaInstance.destroy();
    graficoLinhaInstance = null;
  }

  if (graficoComparativoInstance) {
    graficoComparativoInstance.destroy();
    graficoComparativoInstance = null;
  }
}

function preencherCards() {
  totalRegistrosEl.textContent = registros.length;

  let diasBons = 0;
  let diasRuins = 0;

  const contadorEmocoes = {};

  const positivas = [
    "FELIZ",
    "CALMO",
    "GRATO",
    "OTIMISTA",
    "REALIZADO",
    "ESPERANCOSO",
    "DESPREOCUPADO",
    "APAIXONADO"
  ];

  const negativas = [
    "TRISTE",
    "ANSIOSO",
    "IRRITADO",
    "FRUSTRADO",
    "CULPADO",
    "ANGUSTIADO",
    "PREOCUPADO"
  ];

  registros.forEach((registro) => {
    const emocao = registro.como_me_sinto;

    contadorEmocoes[emocao] = (contadorEmocoes[emocao] || 0) + 1;

    if (positivas.includes(emocao)) {
      diasBons++;
    }

    if (negativas.includes(emocao)) {
      diasRuins++;
    }
  });

  diasBonsEl.textContent = diasBons;
  diasRuinsEl.textContent = diasRuins;

  let emocaoMaisFrequente = "—";
  let maiorQuantidade = 0;

  Object.entries(contadorEmocoes).forEach(([emocao, quantidade]) => {
    if (quantidade > maiorQuantidade) {
      maiorQuantidade = quantidade;
      emocaoMaisFrequente = emocao;
    }
  });

  emocaoFrequenteEl.textContent =
    LABEL_EMOCOES[emocaoMaisFrequente] || emocaoMaisFrequente;
}

function criarGraficoLinha() {
  const labels = registros.map((item) => {
    return formatarData(item.data_checkin);
  });

  const energiaFisica = registros.map((item) => {
    return converterEnergiaFisica(item.energia_fisica);
  });

  const energiaMental = registros.map((item) => {
    return converterEnergiaMental(item.energia_mental);
  });

  const ctx = document.getElementById("graficoLinhaEnergias");

  if (!ctx) return;

  if (graficoLinhaInstance) {
    graficoLinhaInstance.destroy();
  }

  graficoLinhaInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Energia Física",
          data: energiaFisica,
          tension: 0.3
        },
        {
          label: "Energia Mental",
          data: energiaMental,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 10,
            font: {
              size: 11
            }
          }
        }
      }
    }
  });
}

function criarGraficoComparativo() {
  const mentalBoa = registros.filter((item) =>
    ["CLARA", "FOCADA", "CRIATIVA"].includes(item.energia_mental)
  ).length;

  const mentalRuim = registros.filter((item) =>
    ["CONFUSA", "DISPERSA", "SOBRECARREGADA", "ACELERADA"].includes(item.energia_mental)
  ).length;

  const fisicaBoa = registros.filter((item) =>
    ["ENERGIZADO", "LEVE", "RELAXADO"].includes(item.energia_fisica)
  ).length;

  const fisicaRuim = registros.filter((item) =>
    ["CANSADO", "EXAUSTO", "PESADO", "TENSO"].includes(item.energia_fisica)
  ).length;

  const ctx = document.getElementById("graficoComparativo");

  if (!ctx) return;

  if (graficoComparativoInstance) {
    graficoComparativoInstance.destroy();
  }

  graficoComparativoInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [
        "Mental boa",
        "Mental ruim",
        "Física boa",
        "Física ruim"
      ],
      datasets: [
        {
          label: "Quantidade de registros",
          data: [mentalBoa, mentalRuim, fisicaBoa, fisicaRuim]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 10,
            font: {
              size: 11
            }
          }
        }
      }
    }
  });
}

function gerarInsights() {
  const mentalBoa = registros.filter((item) =>
    ["CLARA", "FOCADA", "CRIATIVA"].includes(item.energia_mental)
  ).length;

  const mentalRuim = registros.filter((item) =>
    ["CONFUSA", "DISPERSA", "SOBRECARREGADA", "ACELERADA"].includes(item.energia_mental)
  ).length;

  const fisicaBoa = registros.filter((item) =>
    ["ENERGIZADO", "LEVE", "RELAXADO"].includes(item.energia_fisica)
  ).length;

  const fisicaRuim = registros.filter((item) =>
    ["CANSADO", "EXAUSTO", "PESADO", "TENSO"].includes(item.energia_fisica)
  ).length;

  let mensagem = "";


if (mentalBoa > mentalRuim) {
  mensagem += "🔋 Sua energia mental apresentou mais registros positivos do que difíceis neste período.<br><br>";
} else if (mentalRuim > mentalBoa) {
  mensagem += "🪫 Sua energia mental apareceu mais baixa em vários registros, indicando possível cansaço mental ou sobrecarga.<br><br>";
} else {
  mensagem += "⚖️ Sua energia mental ficou equilibrada neste período.<br><br>";
}

if (fisicaBoa > fisicaRuim) {
  mensagem += "💪 Sua energia física teve bons sinais de disposição e leveza.";
} else if (fisicaRuim > fisicaBoa) {
  mensagem += "🥱 Sua energia física apresentou sinais de cansaço, tensão ou exaustão.";
} else {
  mensagem += "⚖️ Sua energia física ficou equilibrada neste período.";
}

textoInsightsEl.innerHTML = mensagem;
}

function converterEnergiaFisica(valor) {
  const mapa = {
    ENERGIZADO: 5,
    LEVE: 4,
    RELAXADO: 4,
    CANSADO: 2,
    TENSO: 2,
    PESADO: 1,
    EXAUSTO: 0
  };

  return mapa[valor] ?? 0;
}

function converterEnergiaMental(valor) {
  const mapa = {
    CLARA: 5,
    FOCADA: 5,
    CRIATIVA: 4,
    DISPERSA: 2,
    CONFUSA: 1,
    SOBRECARREGADA: 1,
    ACELERADA: 2
  };

  return mapa[valor] ?? 0;
}

function formatarData(data) {
  if (!data) return "—";

  const dataISO = String(data).slice(0, 10);
  const [ano, mes, dia] = dataISO.split("-");

  return `${dia}/${mes}/${ano}`;
}

function formatarDataInput(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}