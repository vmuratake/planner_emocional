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

let registros = [];

document.addEventListener("DOMContentLoaded", () => {
  configurarEventos();
  carregarDashboard();
});

function configurarEventos() {
  btnVoltarHistorico?.addEventListener("click", () => {
    window.location.href = "/historico";
  });
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
    const response = await fetch(
      `${API_BASE_URL}/checkins/dashboard?login_id=${user.id}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.erro || "Erro ao carregar dashboard");
    }

    registros = Array.isArray(data) ? data : [];

    if (registros.length === 0) {
      dashboardVazio.classList.remove("hidden");
      return;
    }

    preencherCards();
    criarGraficoLinha();
    criarGraficoComparativo();
    gerarInsights();

  } catch (error) {
    console.error("Erro dashboard:", error);

    dashboardVazio.classList.remove("hidden");
    dashboardVazio.innerHTML = `
      <p>Não foi possível carregar os dados do dashboard.</p>
    `;
  }
}