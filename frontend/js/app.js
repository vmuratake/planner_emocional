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

function normalizarISODate(value) {
  if (!value) return null;
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

// -------- RENDER ÚLTIMO REGISTRO --------
function renderizarUltimo(checkins) {
  if (!Array.isArray(checkins) || checkins.length === 0) {
    listaCheckinsEl.innerHTML =
      '<p class="status">Nenhum registro encontrado ainda. Crie o primeiro ✨</p>';
    return;
  }

  const c = checkins[0]; // API ordena DESC: mais recente primeiro

  listaCheckinsEl.innerHTML = `
    <div class="checkin-card ultimo">
      <div class="top">
        <div class="date">${dataISOToBR(c.data_checkin)}</div>
        <div class="pill pill-${String(c.nivel_energia).toLowerCase()}">
          ${escapeHtml(c.nivel_energia)} • ${escapeHtml(c.necessidade)}
        </div>
      </div>

      <div class="meta">
        <div class="row"><span class="k">🧠 Peso mental</span><span class="v">${escapeHtml(c.peso_mental)}</span></div>
        <div class="row"><span class="k">✍️ O que ocupou minha mente</span><span class="v">${escapeHtml(c.ocupa_mente)}</span></div>
        <div class="row"><span class="k">🏆 Pequena vitória</span><span class="v">${escapeHtml(c.pequena_vitoria)}</span></div>
      </div>

      <div class="foot">
        <span class="id">ID: ${c.id}</span>
        <span class="created">Criado em: ${dataISOToBR(normalizarISODate(c.created_at)) || ""}</span>
      </div>
    </div>
  `;
}

async function carregarUltimo() {
  try {
    const res = await fetch(`${API_BASE_URL}/checkins`);
    const data = await res.json();

    if (!res.ok) {
      listaCheckinsEl.innerHTML =
        `<p class="status">Erro ao carregar registros (${res.status}).</p>`;
      return;
    }

    renderizarUltimo(data);
  } catch (e) {
    listaCheckinsEl.innerHTML =
      `<p class="status">Falha de conexão ao carregar registros.</p>`;
  }
}

// -------- LIMPAR --------
btnLimpar.addEventListener("click", () => {
  form.reset();
  statusMsg.textContent = "Formulário limpo. Preencha e salve seu registro.";
});

// -------- SUBMIT / POST --------
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const nivel = document.getElementById("nivel_energia").value;
  const necessidade = document.getElementById("necessidade").value;

  const pesoMental = document.getElementById("peso_mental").value.trim();
  const ocupaMente = document.getElementById("ocupa_mente").value.trim();
  const pequenaVitoria = document.getElementById("pequena_vitoria").value.trim();

  if (!nivel) {
    statusMsg.textContent = "Selecione um nível de energia.";
    return;
  }
  if (!necessidade) {
    statusMsg.textContent = "Selecione uma necessidade principal.";
    return;
  }
  if (!pesoMental || !ocupaMente || !pequenaVitoria) {
    statusMsg.textContent = "Preencha Peso mental, O que ocupou sua mente e Pequena vitória.";
    return;
  }

  const payload = {
    data_checkin: dataISOHoje(),
    nivel_energia: nivel,
    peso_mental: pesoMental,
    ocupa_mente: ocupaMente,
    necessidade: necessidade,
    pequena_vitoria: pequenaVitoria,
  };

  try {
    statusMsg.textContent = "Salvando registro...";

    const response = await fetch(`${API_BASE_URL}/checkins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 409) {
        statusMsg.textContent = data.erro || "Já existe registro para esta data.";
        return;
      }
      statusMsg.textContent = data.erro || "Erro ao salvar registro.";
      return;
    }

    statusMsg.textContent = data.mensagem || "Registro salvo com sucesso!";
    await carregarUltimo();
  } catch (error) {
    console.error("Erro de conexão no POST /checkins:", error);
    statusMsg.textContent = "Falha de conexão com a API.";
  }
});

// Carrega ao abrir
carregarUltimo();