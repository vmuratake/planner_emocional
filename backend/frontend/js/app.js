const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://planneremocional-production.up.railway.app";

// =============================
// ELEMENTOS DA TELA
// =============================    
const form = document.getElementById("checkinForm");
const statusMsg = document.getElementById("statusMsg");
const dataAtualEl = document.getElementById("dataAtual");
const btnLimpar = document.getElementById("btnLimpar");
const btnSalvar = document.getElementById("btnSalvar");
const listaCheckinsEl = document.getElementById("listaCheckins");
const btnRecarregar = document.getElementById("btnRecarregar");
const ultimoHint = document.getElementById("ultimoHint");
const secUltimoRegistro = document.getElementById("secUltimoRegistro");

const boasVindasUsuario = document.getElementById("boasVindasUsuario");
const btnMenuUsuario = document.getElementById("btnMenuUsuario");
const menuUsuario = document.getElementById("menuUsuario");
const btnAbrirPerfil = document.getElementById("btnAbrirPerfil");
const btnSairConta = document.getElementById("btnSairConta");

const modalPerfil = document.getElementById("modalPerfil");
const perfilNome = document.getElementById("perfilNome");
const perfilEmail = document.getElementById("perfilEmail");
const perfilDataNascimento = document.getElementById("perfilDataNascimento");

const btnSalvarPerfil = document.getElementById("btnSalvarPerfil");
const btnExcluirConta = document.getElementById("btnExcluirConta");
const btnFecharPerfil = document.getElementById("btnFecharPerfil");

const btnAbrirHistorico = document.getElementById("btnAbrirHistorico");


// ===== Labels amigáveis (para exibir no "Último registro") =====
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
  }
};


// =============================
// FUNÇÕES UTILITÁRIAS
// =============================

// ----------------usuário vinculado------------
function getUsuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function aplicarBoasVindas() {
  const user = getUsuarioLogado();

  if (!user) {
    window.location.href = "/login";
    return;
  }

  const primeiroNome = String(user.nome || "").trim().split(" ")[0] || "usuária";

  if (boasVindasUsuario) {
    boasVindasUsuario.textContent = `✨ Bem-vindo(a), ${primeiroNome} ✨`;
  }
}

function toggleMenuUsuario() {
  if (!menuUsuario) return;
  menuUsuario.classList.toggle("hidden");
}

function fecharMenuUsuario() {
  if (!menuUsuario) return;
  menuUsuario.classList.add("hidden");
}


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


function configurarToggleSenhaPerfil() {
  const botoes = modalPerfil?.querySelectorAll(".toggle-password-text") || [];

  botoes.forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.target;
      const input = document.getElementById(targetId);

      if (!input) return;

      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      button.textContent = isPassword ? "Ocultar" : "Exibir";
      button.setAttribute(
        "aria-label",
        isPassword ? "Ocultar senha" : "Exibir senha"
      );
    });
  });
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
    "como_me_sinto",
    "energia_fisica",
    "energia_mental",
  ];

  selectsObrigatorios.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.selectedIndex = 0;
  });

  document.getElementById("como_me_sinto")?.focus();
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
  <div class="date">📅 ${dataISOToBR(r.data_checkin)} • ⏰ ${horaRegistro}</div>

  <div class="card-menu-wrap">
    <button
      class="card-menu-btn"
      type="button"
      data-id="${r.id}"
      aria-label="Abrir opções do registro"
      title="Opções"
    >
      ⋯
    </button>

    <div class="card-menu hidden" id="menu-checkin-${r.id}">
      <button
        class="btn-excluir-checkin"
        type="button"
        data-id="${r.id}"
      >
        🗑️ Excluir
      </button>
    </div>
  </div>
</div>

      <div class="meta">
        ${linhaEnergia("😊 Como me sinto hoje?", "como_me_sinto", r.como_me_sinto)}
        ${linhaEnergia("🔋 Energia Física", "energia_fisica", r.energia_fisica)}
        ${linhaEnergia("🧠 Energia Mental", "energia_mental", r.energia_mental)}

        ${linhaSeTiver("📝 Me conte como foi seu dia", r.me_conte_seu_dia)}
        ${linhaSeTiver("💡 O que aprendi com os acontecimentos de hoje?", r.aprendizados_hoje)}
        ${linhaSeTiver("✍️ Observações livres", r.observacoes_livres)}
      </div>

      <div class="foot">
        <span class="id">ID: ${r.id}</span>
        <span class="created">Criado em: ${dataISOToBR(r.data_checkin)} • ${horaRegistro}</span>
      </div>
    </div>
  `;

  configurarMenuUltimoRegistro();

}


async function carregarUltimo() {
  try {
    const user = getUsuarioLogado();

    if (!user?.id) {
      listaCheckinsEl.innerHTML =
        `<p class="status">Usuário não identificado. Faça login novamente.</p>`;
      window.location.href = "/login";
      return;
    }

    const res = await fetch(`${API_BASE_URL}/checkins?login_id=${user.id}`);
    const data = await res.json();
    console.log("DEBUG último registro:", data?.[0]);

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


// -------- EXCLUIR CHECKIN --------
function fecharTodosMenusCheckin() {
  document.querySelectorAll(".card-menu").forEach((menu) => {
    menu.classList.add("hidden");
  });
}


// -------- CONFIGURAR MENU DO ÚLTIMO REGISTRO --------
function configurarMenuUltimoRegistro() {
  const btnMenu = document.querySelector(".card-menu-btn");
  const btnExcluir = document.querySelector(".btn-excluir-checkin");

  btnMenu?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const id = btnMenu.dataset.id;
    const menu = document.getElementById(`menu-checkin-${id}`);
    if (!menu) return;

    const estavaFechado = menu.classList.contains("hidden");

    fecharTodosMenusCheckin();

    if (estavaFechado) {
      menu.classList.remove("hidden");
    } else {
      menu.classList.add("hidden");
    }
  });

  btnExcluir?.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const id = btnExcluir.dataset.id;
    if (!id) return;

    const usuarioLogado = getUsuarioLogado();
    if (!usuarioLogado?.id) {
      setStatus("Usuário não identificado. Faça login novamente.");
      window.location.href = "/login";
      return;
    }

    const confirmar = confirm("Tem certeza que deseja excluir este último registro?");
    if (!confirmar) return;

    try {
      const res = await fetch(`${API_BASE_URL}/checkins/${id}?login_id=${usuarioLogado.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus(data.erro || "Erro ao excluir registro.");
        return;
      }

      listaCheckinsEl.innerHTML =
        '<p class="status">Registro excluído com sucesso ✅</p>';

      setStatusTemporario("Último registro excluído ✅", 3000);
      fecharTodosMenusCheckin();
    } catch (error) {
      console.error("Erro ao excluir check-in:", error);
      setStatus("Falha de conexão ao excluir registro.");
    }
  });
}


// -------- STATUS ÚLTIMO REGISTRO --------
// ===== HINT DO "ÚLTIMO REGISTRO"  =====
const hintUltimo = document.querySelector(".section-actions .hint");

const HINT_PADRAO = "Clique para visualizar o último registro";
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

/* =============================
   3. EVENTOS  
============================= */

// BOTÃO ENGRENAGEM
btnMenuUsuario?.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleMenuUsuario();
});


// BOTÃO AVANÇAR PARA HISTÓRICO
btnAbrirHistorico?.addEventListener("click", () => {
  window.location.href = "/historico";
});


// FECHAR MENU AO CLICAR FORA
document.addEventListener("click", (e) => {
  if (!menuUsuario || !btnMenuUsuario) return;

  const clicouNoMenu = menuUsuario.contains(e.target);
  const clicouNoBotao = btnMenuUsuario.contains(e.target);
  const clicouNoBotaoMenuCheckin = e.target.closest(".card-menu-btn");
  const clicouNoMenuCheckin = e.target.closest(".card-menu");

  if (!clicouNoMenu && !clicouNoBotao) {
    fecharMenuUsuario();
  }

  if (!clicouNoBotaoMenuCheckin && !clicouNoMenuCheckin) {
    fecharTodosMenusCheckin();
  }
});

// SAIR
btnSairConta?.addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "/login";
});

// PERFIL (Abrir modal)
btnAbrirPerfil?.addEventListener("click", () => {
  fecharMenuUsuario();

  const user = getUsuarioLogado();
  if (!user) return;

  perfilNome.value = user.nome || "";
  perfilEmail.value = user.email || "";
  perfilDataNascimento.value = user.data_nascimento?.split("T")[0] || "";

  const senha1 = document.getElementById("novaSenhaPerfil");
  const senha2 = document.getElementById("novaSenhaPerfil2");
  if (senha1) senha1.value = "";
  if (senha2) senha2.value = "";

  modalPerfil.classList.remove("hidden");
});

// PERFIL (Fechar modal)
btnFecharPerfil?.addEventListener("click", () => {
  modalPerfil.classList.add("hidden");
});


// PERFIL (Salvar alterações)
btnSalvarPerfil?.addEventListener("click", async () => {
  const user = getUsuarioLogado();
  if (!user) return;

  const novaSenha = document.getElementById("novaSenha")?.value;
  const novaSenha2 = document.getElementById("novaSenha2")?.value;

  // validação de senha
  if (novaSenha || novaSenha2) {
    if (novaSenha !== novaSenha2) {
      alert("As senhas não coincidem");
      return;
    }

    if (novaSenha.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres");
      return;
    }
  }

  try {
    const res = await fetch(`/auth/${user.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome: perfilNome.value,
        data_nascimento: perfilDataNascimento.value,
        senha: novaSenha || null
      }),
    });

    if (!res.ok) {
      alert("Erro ao atualizar perfil");
      return;
    }

    const updatedUser = {
      ...user,
      nome: perfilNome.value,
      data_nascimento: perfilDataNascimento.value,
    };

    localStorage.setItem("user", JSON.stringify(updatedUser));

    aplicarBoasVindas();

    alert("Perfil atualizado com sucesso ✅");

    // limpa campos de senha
    document.getElementById("novaSenha").value = "";
    document.getElementById("novaSenha2").value = "";

    modalPerfil.classList.add("hidden");

  } catch (err) {
    console.error(err);
    alert("Erro de conexão");
  }
});

// Perfil (Excluir conta)
btnExcluirConta?.addEventListener("click", async () => {
  const user = getUsuarioLogado();

  if (!user) return;

  const confirmar = confirm("Tem certeza que deseja excluir sua conta?");

  if (!confirmar) return;

  try {
    const res = await fetch(`/auth/${user.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      alert("Erro ao excluir conta");
      return;
    }

    localStorage.removeItem("user");

    alert("Conta excluída com sucesso");

    window.location.href = "/login";

  } catch (err) {
    console.error(err);
    alert("Erro de conexão");
  }
});


// -------- LIMPAR --------
btnLimpar.addEventListener("click", () => {
  form.reset();
  limparChipsAtivos();

  const selectsObrigatorios = [
    "energia_fisica",
    "energia_mental",
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
  if (btnRecarregar.classList.contains("is-loading")) return;

  btnRecarregar.classList.add("is-loading");

  setHintUltimo("Recarregando último registro...", "loading");

  try {
    await carregarUltimo();

    // 👉 abre o bloco ao carregar
    secUltimoRegistro?.classList.remove("is-collapsed");

    setHintUltimo("Último registro atualizado ✅", "success");

  } catch (e) {
    setHintUltimo("Falha ao atualizar. Tente novamente.", "default");
  } finally {
    btnRecarregar.classList.remove("is-loading");
  }
});

// Fecha menus de check-in 
document.addEventListener("click", (e) => {
  const clicouNoBotao = e.target.closest(".card-menu-btn");
  const clicouNoMenu = e.target.closest(".card-menu");

  if (clicouNoBotao || clicouNoMenu) return;

  fecharTodosMenusCheckin();
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
  const comoMeSinto = document.getElementById("como_me_sinto").value;
  const energiaFisica = document.getElementById("energia_fisica").value;
  const energiaMental = document.getElementById("energia_mental").value;

  // CAPTURA DAS TEXTAREAS
  const meConteSeuDia = document.getElementById("me_conte_seu_dia")?.value.trim() || "";
  const aprendizadosHoje = document.getElementById("aprendizados_hoje")?.value.trim() || "";
  const observacoesLivres = document.getElementById("observacoes_livres")?.value.trim() || "";

  // ✅ Regras mínimas de preenchimento obrigatório (domínio)
  if (!comoMeSinto) return setStatus("Selecione como você se sente hoje.");
  if (!energiaFisica) return setStatus("Selecione a Energia Física.");
  if (!energiaMental) return setStatus("Selecione a Energia Mental.");


  const usuarioLogado = getUsuarioLogado();

  if (!usuarioLogado?.id) {
    setStatus("Usuário não identificado. Faça login novamente.");
    window.location.href = "/login";
    return;
  }


  const payload = {
    login_id: usuarioLogado.id,
    data_checkin: dataISOHoje(),
    horario_registro_local: horaRegistroLocal,

    como_me_sinto: comoMeSinto,
    energia_fisica: energiaFisica,
    energia_mental: energiaMental,

    me_conte_seu_dia: meConteSeuDia || null,
    aprendizados_hoje: aprendizadosHoje || null,
    observacoes_livres: observacoesLivres || null,
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
const usuarioLogado = getUsuarioLogado();

if (!usuarioLogado) {
  window.location.href = "/login";
} else {
  setStatus(STATUS_PADRAO);
  setHintUltimo(HINT_PADRAO, "default");
  configurarChips();
  aplicarBoasVindas();

  configurarToggleSenhaPerfil();
  carregarUltimo();
}