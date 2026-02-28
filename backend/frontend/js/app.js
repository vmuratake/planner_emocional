const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://planneremocional-production.up.railway.app";

const form = document.getElementById("checkinForm");
const statusMsg = document.getElementById("statusMsg");
const dataAtualEl = document.getElementById("dataAtual");
const btnLimpar = document.getElementById("btnLimpar");
const btnSalvar = document.getElementById("btnSalvar");
const listaCheckinsEl = document.getElementById("listaCheckins");
const btnRecarregar = document.getElementById("btnRecarregar");
const ultimoHint = document.getElementById("ultimoHint");


// ===== Labels amigáveis (para exibir no "Último registro") =====
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

// ----------------formata: enum -> label amigável------------
function labelFrom(field, rawValue) {
  if (!rawValue) return "—";
  const key = String(rawValue).trim().toUpperCase();
  return LABELS?.[field]?.[key] ?? key; // fallback: mostra o enum se não existir no mapa
}


// -------- STATUS HELPERS --------
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

function horaLocalHHMM() {
  const agora = new Date();
  const hh = String(agora.getHours()).padStart(2, "0");
  const mm = String(agora.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function iniciarRelogioLocal() {
  if (!infoHoraEl) return;

  function atualizar() {
    const agora = new Date();
    infoHoraEl.textContent = agora.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    // micro animação (sem mexer em layout)
    infoHoraEl.classList.remove("is-ticking");
    void infoHoraEl.offsetWidth; // reinicia a animação
    infoHoraEl.classList.add("is-ticking");
  }

  atualizar();                 // já mostra imediato
  setInterval(atualizar, 1000); // atualiza a cada 1s
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

dataAtualEl.textContent = "";

const infoDataEl = document.getElementById("infoDataCheckin");
const infoHoraEl = document.getElementById("infoHoraRegistro");

if (infoDataEl) infoDataEl.textContent = dataISOToBR(dataISOHoje());
iniciarRelogioLocal();



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
  const selectsObrigatorios = [
    "energia_fisica",
    "energia_mental",
    "energia_emocional",
    "energia_espiritual",
    "energia_social",
  ];

  selectsObrigatorios.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.selectedIndex = 0;
  });

  document.getElementById("energia_fisica")?.focus();
}

// -------- RENDER ÚLTIMO REGISTRO --------
function renderizarUltimo(registros) {
  if (!Array.isArray(registros) || registros.length === 0) {
    listaCheckinsEl.innerHTML =
      '<p class="status">Nenhum registro encontrado ainda. Crie o primeiro ✨</p>';
    return;
  }

  const r = registros[0];

  const horaRegistro = r.horario_registro_local
    ? escapeHtml(r.horario_registro_local)
    : "—";

  // helper: renderiza uma linha somente se tiver valor
  const linhaSeTiver = (rotulo, valor) => {
    if (valor == null) return "";
    const v = String(valor).trim();
    if (!v) return "";
    return `
      <div class="row">
        <span class="k">${rotulo}</span>
        <span class="v">${escapeHtml(v)}</span>
      </div>
    `;
  };

// helper: energia obrigatória (sempre mostra) - exibe label amigável
const linhaEnergia = (rotulo, field, valor) => `
  <div class="row">
    <span class="k">${rotulo}</span>
    <span class="v">${escapeHtml(labelFrom(field, valor))}</span>
  </div>
`;

  listaCheckinsEl.innerHTML = `
    <div class="checkin-card ultimo">
      <div class="top">
        <div class="date">${dataISOToBR(r.data_checkin)}</div>
        <div class="pill">📅 ${dataISOToBR(r.data_checkin)} • ⏰ ${horaRegistro}</div>
      </div>

      <div class="meta">
${linhaEnergia("🔋 Energia Física", "energia_fisica", r.energia_fisica)}
${linhaEnergia("🧠 Energia Mental", "energia_mental", r.energia_mental)}
${linhaEnergia("❤️ Energia Emocional", "energia_emocional", r.energia_emocional)}
${linhaEnergia("🌱 Energia Espiritual", "energia_espiritual", r.energia_espiritual)}
${linhaEnergia("🧍 Energia Social", "energia_social", r.energia_social)}

        ${linhaSeTiver("💭 O que ocupou minha mente", r.ocupou_mente)}
        ${linhaSeTiver("🧠 O que mais me afetou hoje?", r.afetou_hoje)}
        ${linhaSeTiver("🌱 Algo simples que posso fazer por mim", r.autocuidado)}
        ${linhaSeTiver("✍️ Observações Livres", r.observacoes_livres)}
        ${linhaSeTiver("🏆 Pequena vitória", r.pequena_vitoria)}
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


// -------- STATUS ÚLTIMO REGISTRO --------
// ===== HINT DO "ÚLTIMO REGISTRO"  =====
const hintUltimo = document.querySelector(".section-actions .hint");

const HINT_PADRAO = "atualiza automaticamente ao salvar";
let hintTimerId = null;

function setHintUltimo(msg, variant = "default") {
  if (!hintUltimo) return;

  // texto
  hintUltimo.textContent = msg;

  // estados de cor (bem sutis)
  hintUltimo.classList.remove("is-loading", "is-success");
  if (variant === "loading") hintUltimo.classList.add("is-loading");
  if (variant === "success") hintUltimo.classList.add("is-success");

  // micro “respira”
  hintUltimo.classList.remove("is-animating");
  // força reflow pra reiniciar animação
  void hintUltimo.offsetWidth;
  hintUltimo.classList.add("is-animating");

  // volta ao padrão (se quiser)
  if (hintTimerId) clearTimeout(hintTimerId);
  if (variant !== "default") {
    hintTimerId = setTimeout(() => {
      hintUltimo.textContent = HINT_PADRAO;
      hintUltimo.classList.remove("is-loading", "is-success");
    }, 1600);
  }
}


// -------- LIMPAR --------
btnLimpar.addEventListener("click", () => {
  form.reset();
  limparChipsAtivos();

  const selectsObrigatorios = [
    "energia_fisica",
    "energia_mental",
    "energia_emocional",
    "energia_espiritual",
    "energia_social",
  ];

  selectsObrigatorios.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.selectedIndex = 0;
  });

  document.getElementById("energia_fisica")?.focus();

  setStatus("Formulário limpo. Preencha e salve seu registro.");
});

// -------- RECARREGAR --------
btnRecarregar?.addEventListener("click", async () => {
  if (btnRecarregar.classList.contains("is-loading")) return; // evita spam

  // liga giro do botão
  btnRecarregar.classList.add("is-loading");

  // mostra no HINT (não mexe no status abaixo do salvar)
  setHintUltimo("Recarregando último registro...", "loading");

  try {
    await carregarUltimo();
    setHintUltimo("Último registro atualizado ✅", "success");
  } catch (e) {
    // opcional: sinalizar erro sem chamar atenção
    setHintUltimo("Falha ao atualizar. Tente novamente.", "default");
  } finally {
    // desliga giro do botão
    btnRecarregar.classList.remove("is-loading");
  }
});

// -------- SUBMIT / POST --------
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  // evita duplo clique/duplo submit
  if (btnSalvar?.disabled) return;

  // hora local do navegador no momento do clique
  const horaRegistroLocal = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });


  if (infoHoraEl) infoHoraEl.textContent = horaRegistroLocal;


  // CAPTURA DOS SELECTS
  const energiaFisica = document.getElementById("energia_fisica").value;
  const energiaMental = document.getElementById("energia_mental").value;
  const energiaEmocional = document.getElementById("energia_emocional").value;
  const energiaEspiritual = document.getElementById("energia_espiritual").value;
  const energiaSocial = document.getElementById("energia_social").value;

  // CAPTURA DAS TEXTAREAS
  const ocupouMente = document.getElementById("ocupou_mente")?.value.trim() || "";
  const pequenaVitoria = document.getElementById("pequena_vitoria")?.value.trim() || "";
  const afetouHoje = document.getElementById("afetou_hoje")?.value.trim() || "";
  const autocuidado = document.getElementById("autocuidado")?.value.trim() || "";
  const observacoesLivres = document.getElementById("observacoes_livres")?.value.trim() || "";

  // ✅ Regras mínimas de preenchimento obrigatório (domínio)
  if (!energiaFisica) return setStatus("Selecione a Energia Física.");
  if (!energiaMental) return setStatus("Selecione a Energia Mental.");
  if (!energiaEmocional) return setStatus("Selecione a Energia Emocional.");
  if (!energiaEspiritual) return setStatus("Selecione a Energia Espiritual.");
  if (!energiaSocial) return setStatus("Selecione a Energia Social.");


  const payload = {
    data_checkin: dataISOHoje(),
    horario_registro_local: horaRegistroLocal,

    energia_fisica: energiaFisica,
    energia_mental: energiaMental,
    energia_emocional: energiaEmocional,
    energia_espiritual: energiaEspiritual,
    energia_social: energiaSocial,

    ocupou_mente: ocupouMente || null,
    afetou_hoje: afetouHoje || null,
    autocuidado: autocuidado || null,
    observacoes_livres: observacoesLivres || null,
    pequena_vitoria: pequenaVitoria || null,
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
    setHintUltimo("Último registro atualizado ✅", "success");

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
setHintUltimo(HINT_PADRAO, "default");
configurarChips();
carregarUltimo();