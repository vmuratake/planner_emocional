const API_BASE_URL = "http://localhost:3000";

const form = document.getElementById("checkinForm");
const statusMsg = document.getElementById("statusMsg");
const dataAtualEl = document.getElementById("dataAtual");
const btnLimpar = document.getElementById("btnLimpar");
const listaCheckinsEl = document.getElementById("listaCheckins");

// -------- DATA NO TOPO --------
function formatarDataBR(data) {
  return data.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function dataISOHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// aceita: Date, "YYYY-MM-DD", "YYYY-MM-DDT00:00:00.000Z"
function normalizarISODate(value) {
  if (!value) return null;

  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const s = String(value);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function dataISOToBR(isoLike) {
  const iso = normalizarISODate(isoLike);
  if (!iso) return "";

  const parts = iso.split("-");
  if (parts.length !== 3) return iso;

  const [y, m, d] = parts;
  const dt = new Date(Number(y), Number(m) - 1, Number(d));
  return formatarDataBR(dt);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

dataAtualEl.textContent = formatarDataBR(new Date());

// -------- RENDERIZAR LISTA (READ) --------
function renderizarLista(checkins) {
  console.log("[renderizarLista] recebido:", checkins);

  if (!Array.isArray(checkins) || checkins.length === 0) {
    listaCheckinsEl.innerHTML =
      '<p class="status">Nenhum check-in encontrado. Crie o primeiro ✨</p>';
    return;
  }

  const html = checkins.slice(0, 10).map((c) => {
    const peso = c.peso_mental
      ? ` • <small>Peso mental: ${escapeHtml(c.peso_mental)}</small>`
      : "";

    const mente = c.mente_texto
      ? `<div class="meta"><small>Mente: </small>${escapeHtml(c.mente_texto)}</div>`
      : "";

    const vitoria = c.pequena_vitoria
      ? `<div class="meta"><small>Vitória: </small>${escapeHtml(
          c.pequena_vitoria
        )}</div>`
      : "";

    return `
      <div class="checkin-card">
        <div class="top">
          <div class="date">${dataISOToBR(c.data_checkin)}</div>
          <div class="pill">${escapeHtml(c.nivel_energia)} • ${escapeHtml(
      c.necessidade
    )}</div>
        </div>
        <div class="meta"><small>ID:</small> ${c.id}${peso}</div>
        ${mente}
        ${vitoria}
      </div>
    `;
  }).join("");

  listaCheckinsEl.innerHTML = html;
}

async function carregarLista() {
  try {
    console.log("[carregarLista] GET", `${API_BASE_URL}/checkins`);

    const res = await fetch(`${API_BASE_URL}/checkins`);
    const text = await res.text(); // <-- importante pra debugar qualquer coisa

    console.log("[carregarLista] status:", res.status);
    console.log("[carregarLista] body:", text);

    if (!res.ok) {
      listaCheckinsEl.innerHTML = `<p class="status">Erro ao carregar check-ins (${res.status}).</p>`;
      return;
    }

    const data = JSON.parse(text);
    renderizarLista(data);
  } catch (e) {
    console.error("[carregarLista] erro:", e);
    listaCheckinsEl.innerHTML = `<p class="status">Falha de conexão ao carregar check-ins.</p>`;
  }
}

// -------- LIMPAR FORM --------
btnLimpar.addEventListener("click", () => {
  form.reset();
  statusMsg.textContent =
    "Formulário limpo. Selecione um nível de energia para continuar.";
});

// -------- SUBMIT / POST --------
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const nivelSelecionado = document.querySelector(
    'input[name="nivel_energia"]:checked'
  );
  if (!nivelSelecionado) {
    statusMsg.textContent = "Selecione um nível de energia para continuar.";
    return;
  }

  const necessidadeSelecionada = document.querySelector(
    'input[name="necessidade"]:checked'
  );
  if (!necessidadeSelecionada) {
    statusMsg.textContent = "Selecione uma necessidade principal para continuar.";
    return;
  }

  const payload = {
    data_checkin: dataISOHoje(),
    nivel_energia: nivelSelecionado.value,
    peso_mental: document.getElementById("peso_mental").value.trim() || null,
    mente_texto: document.getElementById("mente_texto").value.trim() || null,
    necessidade: necessidadeSelecionada.value,
    pequena_vitoria:
      document.getElementById("pequena_vitoria").value.trim() || null,
  };

  if (!payload.pequena_vitoria) {
    statusMsg.textContent = "Preencha a Pequena Vitória para salvar o check-in.";
    return;
  }

  try {
    statusMsg.textContent = "Salvando check-in...";

    const response = await fetch(`${API_BASE_URL}/checkins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      statusMsg.textContent = data.erro || "Erro ao salvar check-in.";
      return;
    }

    statusMsg.textContent = data.mensagem || "Check-in salvo com sucesso!";
    await carregarLista();
  } catch (error) {
    console.error("Erro de conexão no POST /checkins:", error);
    statusMsg.textContent = "Falha de conexão com a API.";
  }
});

carregarLista();