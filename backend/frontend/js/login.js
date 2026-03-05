const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://planneremocional-production.up.railway.app";

// ===== Elementos =====
const modal = document.getElementById("modalCriarConta");
const btnCriarConta = document.getElementById("btnCriarConta");
const btnSairModal = document.getElementById("btnSairModal");
const btnSalvarDados = document.getElementById("btnSalvarDados");
const btnExcluirConta = document.getElementById("btnExcluirConta");

const loginForm = document.getElementById("loginForm");
const loginStatus = document.getElementById("loginStatus");

const cadastroStatus = document.getElementById("cadastroStatus");
const nomeCadastro = document.getElementById("nomeCadastro");
const emailCadastro = document.getElementById("emailCadastro");
const nascimentoCadastro = document.getElementById("nascimentoCadastro");
const senhaCadastro = document.getElementById("senhaCadastro");
const senhaCadastro2 = document.getElementById("senhaCadastro2");

// ===== Helpers =====
function setStatus(el, msg) {
  if (!el) return;
  el.textContent = msg || "";
}

function abrirModal() {
  modal?.classList.remove("hidden");
  modal?.setAttribute("aria-hidden", "false");
  setStatus(cadastroStatus, "");
  nomeCadastro?.focus();
}

function fecharModal() {
  modal?.classList.add("hidden");
  modal?.setAttribute("aria-hidden", "true");
}

btnCriarConta?.addEventListener("click", abrirModal);
btnSairModal?.addEventListener("click", fecharModal);

// fechar clicando fora do conteúdo
modal?.addEventListener("click", (e) => {
  if (e.target === modal) fecharModal();
});

// ===== CADASTRO =====
btnSalvarDados?.addEventListener("click", async () => {
  try {
    setStatus(cadastroStatus, "");

    const nome = nomeCadastro?.value.trim();
    const email = emailCadastro?.value.trim();
    const data_nascimento = nascimentoCadastro?.value;
    const senha = senhaCadastro?.value || "";
    const senha2 = senhaCadastro2?.value || "";

    if (!nome || !email || !data_nascimento || !senha || !senha2) {
      return setStatus(cadastroStatus, "Preencha todos os campos do cadastro.");
    }

    if (senha.length < 6) {
      return setStatus(cadastroStatus, "A senha deve ter no mínimo 6 caracteres.");
    }

    if (senha !== senha2) {
      return setStatus(cadastroStatus, "As senhas não conferem.");
    }

    // chama API
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, senha, data_nascimento }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 409) return setStatus(cadastroStatus, data.erro || "Email já cadastrado.");
      return setStatus(cadastroStatus, data.erro || "Erro ao cadastrar.");
    }

    // sucesso
    setStatus(cadastroStatus, "Conta criada com sucesso ✅");

    // Esconde salvar e mostra excluir (como você pediu)
    btnSalvarDados?.classList.add("hidden");
    btnExcluirConta?.classList.remove("hidden");

    // pré-preenche o login
    document.getElementById("email").value = email;
    document.getElementById("senha").value = "";

  } catch (err) {
    console.error(err);
    setStatus(cadastroStatus, "Falha de conexão ao cadastrar.");
  }
});

// ===== EXCLUIR CONTA (placeholder por enquanto) =====
btnExcluirConta?.addEventListener("click", () => {
  const ok = window.confirm("Tem certeza que deseja excluir a conta?");
  if (!ok) return;

  // Próximo passo: criar DELETE /auth/:id
  setStatus(cadastroStatus, "Exclusão ainda não implementada (próximo passo).");
});

// ===== LOGIN =====
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus(loginStatus, "");

  const email = document.getElementById("email")?.value.trim();
  const senha = document.getElementById("senha")?.value;

  if (!email || !senha) {
    return setStatus(loginStatus, "Informe email e senha.");
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return setStatus(loginStatus, data.erro || "Email ou senha inválidos.");
    }

    // opcional: guardar usuário logado no navegador (AC2 simples)
    localStorage.setItem("user", JSON.stringify(data.user));

    setStatus(loginStatus, "Login OK ✅ Redirecionando...");
    window.location.href = "/"; // vai pro check-in atual

  } catch (err) {
    console.error(err);
    setStatus(loginStatus, "Falha de conexão ao fazer login.");
  }
});