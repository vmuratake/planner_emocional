const API_BASE_URL = "http://localhost:3000";

const form = document.getElementById("checkinForm");
const statusMsg = document.getElementById("statusMsg");
const dataAtualEl = document.getElementById("dataAtual");
const btnLimpar = document.getElementById("btnLimpar");
const btnSalvar = document.getElementById("btnSalvar");
const listaCheckinsEl = document.getElementById("listaCheckins");
const btnRecarregar = document.getElementById("btnRecarregar");

// -------- STATUS HELPERS (NOVO) --------
const STATUS_PADRAO = "Preencha os campos e salve seu registro.";
let statusTimerId = null;

function setStatus(msg) {
  statusMsg.textContent = msg;
}

function setStatusTemporario(msg, ms = 2000) {
  if (statusTimerId) clearTimeout(statusTimerId);
  setStatus(msg);
  statusTimerId = setTimeout(() => {
    setStatus(STATUS_PADRAO);
    statusTimerId = null;
  }, ms);
}

function setSaving(isSaving) {
  if (!btnSalvar) return;

  btnSalvar.disabled = isSaving;
  btnSalvar.setAttribute("aria-busy", String(isSaving));

  if (isSaving) {
    btnSalvar.dataset.originalText = btnSalvar.textContent;
    btnSalvar.textContent = "Salvando…";
    btnSalvar.style.opacity = "0.75";
    btnSalvar.style.cursor = "not-allowed";
  } else {
    btnSalvar.textContent = btnSalvar.dataset.originalText || "Salvar";
    btnSalvar.style.opacity = "";
    btnSalvar.style.cursor = "";
  }
}

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

// -------- CHIPS -> SELECT --------
function marcarChipAtivo(chipsContainer, value) {
  const chips = chipsContainer.querySelectorAll(".chip");
  chips.forEach((c) => c.classList.toggle("is-active", c.dataset.value === value));
}

function configurarChips() {
  const containers = document.querySelectorAll(".chips[data-target]");
  containers.forEach((wrap) => {
    const targetId = wrap.dataset.target;
    const select = document.getElementById(targetId);
    if (!select) return;

    // clique no chip seleciona o valor
    wrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;

      const val = btn.dataset.value;
      select.value = val;
      marcarChipAtivo(wrap, val);
    });

    // quando select muda manualmente
    select.addEventListener("change", () => {
      marcarChipAtivo(wrap, select.value);
    });
  });
}

// -------- RESET APÓS SALVAR --------
function limparChipsAtivos() {
  document.querySelectorAll(".chips").forEach((wrap) => {
    wrap.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
  });
}

function resetarFormularioAposSalvar() {
  form.reset();
  limparChipsAtivos();

  // garante selects no "Selecione..."
  const selEnergia = document.getElementById("nivel_energia");
  const selNec = document.getElementById("necessidade");
  if (selEnergia) selEnergia.selectedIndex = 0;
  if (selNec) selNec.selectedIndex = 0;

  selEnergia?.focus();
}

// -------- RENDER ÚLTIMO REGISTRO --------
function renderizarUltimo(registros) {
  if (!Array.isArray(registros) || registros.length === 0) {
    listaCheckinsEl.innerHTML =
      '<p class="status">Nenhum registro encontrado ainda. Crie o primeiro ✨</p>';
    return;
  }

  const r = registros[0];

  const energiaEmoji = {
    MUITO_CANSADA: "🥱",
    CANSADA: "😮‍💨",
    OK: "🙂",
    BEM: "😄",
    EM_PAZ: "😌",
  };

  const necessidadeEmoji = {
    DESCANSO: "🛌",
    MOVIMENTO: "🏃",
    SILENCIO: "🤫",
    CONVERSA: "💬",
    ORACAO: "🙏",
    ORGANIZACAO: "🗂️",
  };

  const eEm = energiaEmoji[r.nivel_energia] ? `${energiaEmoji[r.nivel_energia]} ` : "";
  const nEm = necessidadeEmoji[r.necessidade] ? ` ${necessidadeEmoji[r.necessidade]}` : "";

  listaCheckinsEl.innerHTML = `
    <div class="checkin-card ultimo">
      <div class="top">
        <div class="date">${dataISOToBR(r.data_checkin)}</div>
        <div class="pill">${eEm}${escapeHtml(r.nivel_energia)} • ${escapeHtml(r.necessidade)}${nEm}</div>
      </div>

      <div class="meta">
        <div class="row">
          <span class="k">🧠 Peso mental</span>
          <span class="v">${escapeHtml(r.peso_mental)}</span>
        </div>

        <div class="row">
          <span class="k">💭 O que ocupou minha mente</span>
          <span class="v">${escapeHtml(r.ocupa_mente)}</span>
        </div>

        <div class="row">
          <span class="k">🏆 Pequena vitória</span>
          <span class="v">${escapeHtml(r.pequena_vitoria)}</span>
        </div>
      </div>

      <div class="foot">
        <span class="id">ID: ${r.id}</span>
        <span class="created">Criado em: ${dataISOToBR(normalizarISODate(r.created_at)) || ""}</span>
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
  limparChipsAtivos();

  const selEnergia = document.getElementById("nivel_energia");
  const selNec = document.getElementById("necessidade");
  if (selEnergia) selEnergia.selectedIndex = 0;
  if (selNec) selNec.selectedIndex = 0;

  setStatus("Formulário limpo. Preencha e salve seu registro.");
});

// -------- RECARREGAR --------
btnRecarregar?.addEventListener("click", async () => {
  setStatus("Recarregando último registro...");
  await carregarUltimo();
  setStatusTemporario("Último registro atualizado ✅", 1500);
});

// -------- SUBMIT / POST --------
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  // evita duplo clique/duplo submit
  if (btnSalvar?.disabled) return;

  const nivel = document.getElementById("nivel_energia").value;
  const necessidade = document.getElementById("necessidade").value;

  const pesoMental = document.getElementById("peso_mental").value.trim();
  const ocupaMente = document.getElementById("ocupa_mente").value.trim();
  const pequenaVitoria = document.getElementById("pequena_vitoria").value.trim();

  if (!nivel) return setStatus("Selecione um nível de energia.");
  if (!necessidade) return setStatus("Selecione uma necessidade principal.");
  if (!pesoMental || !ocupaMente || !pequenaVitoria) {
    return setStatus("Preencha Peso mental, O que ocupou sua mente e Pequena vitória.");
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
    setSaving(true);
    setStatus("Salvando registro...");

    const response = await fetch(`${API_BASE_URL}/checkins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 409) {
        setStatus(data.erro || "Já existe registro para esta data.");
        return;
      }
      setStatus(data.erro || "Erro ao salvar registro.");
      return;
    }

    // ✅ sucesso
    resetarFormularioAposSalvar();
    await carregarUltimo();

    // ✅ mostra “salvo ✅” por 2s e volta pro padrão
    setStatusTemporario("Salvo ✅", 3000);
  } catch (error) {
    console.error("Erro de conexão no POST /checkins:", error);
    setStatus("Falha de conexão com a API.");
  } finally {
    setSaving(false);
  }
});

// Inicialização
setStatus(STATUS_PADRAO);
configurarChips();
carregarUltimo();