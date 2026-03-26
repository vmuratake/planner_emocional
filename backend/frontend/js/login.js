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
function setStatus(el, msg, type = "info") {
  if (!el) return;
  el.textContent = msg || "";
  el.classList.remove("is-success", "is-error", "is-info");

  if (type === "success") el.classList.add("is-success");
  else if (type === "error") el.classList.add("is-error");
  else el.classList.add("is-info");
}

function setButtonLoading(button, isLoading, loadingText, defaultText) {
  if (!button) return;

  if (isLoading) {
    button.disabled = true;
    button.classList.add("is-loading");
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
  } else {
    button.disabled = false;
    button.classList.remove("is-loading");
    button.textContent = defaultText || button.dataset.originalText || "Salvar";
  }
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


// mostrar/ocultar senha
document.querySelectorAll(".toggle-password-text").forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.dataset.target;
    const input = document.getElementById(targetId);

    if (!input) return;

    const isPassword = input.type === "password";

    // alterna tipo
    input.type = isPassword ? "text" : "password";

    // troca texto
    button.textContent = isPassword ? "Ocultar" : "Exibir";

    // acessibilidade
    button.setAttribute(
      "aria-label",
      isPassword ? "Ocultar senha" : "Exibir senha"
    );
  });
});


// ===== CADASTRO =====
btnSalvarDados?.addEventListener("click", async () => {
  try {
    setStatus(cadastroStatus, "", "info");

    const nome = nomeCadastro?.value.trim();
    const email = emailCadastro?.value.trim();
    const data_nascimento = nascimentoCadastro?.value;
    const senha = senhaCadastro?.value || "";
    const senha2 = senhaCadastro2?.value || "";

    if (!nome || !email || !data_nascimento || !senha || !senha2) {
      return setStatus(cadastroStatus, "Preencha todos os campos do cadastro.", "error");
    }

    if (senha.length < 6) {
      return setStatus(cadastroStatus, "A senha deve ter no mínimo 6 caracteres.", "error");
    }

    if (senha !== senha2) {
      return setStatus(cadastroStatus, "As senhas não conferem.", "error");
    }

    setButtonLoading(btnSalvarDados, true, "Salvando...", "Salvar dados");

    // chama API
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, senha, data_nascimento }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 409) {
        return setStatus(cadastroStatus, data.erro || "Email já cadastrado.", "error");
    }
      return setStatus(cadastroStatus, data.erro || "Erro ao cadastrar.", "error");
    }

    // sucesso
    setStatus(cadastroStatus, "Conta criada com sucesso ✅", "success");

    // guarda usuário criado localmente
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: data.id,
        nome,
        email,
        data_nascimento
      })
    );

    // Esconde salvar e mostra excluir 
    btnSalvarDados?.classList.add("hidden");
    btnExcluirConta?.classList.remove("hidden");

    // pré-preenche o login
    document.getElementById("email").value = email;
    document.getElementById("senha").value = "";
    senhaCadastro.value = "";
    senhaCadastro2.value = "";

  } catch (err) {
    console.error(err);
    setStatus(cadastroStatus, "Falha de conexão ao cadastrar.", "error");
  } finally {
    setButtonLoading(btnSalvarDados, false, "Salvando...", "Salvar dados");
  }
});


// ===== EXCLUIR CONTA  =====
btnExcluirConta?.addEventListener("click", async () => {
  const ok = window.confirm("Tem certeza que deseja excluir a conta?");
  if (!ok) return;

  try {
    // tenta pegar do localStorage (se já tiver logado)
    const user = JSON.parse(localStorage.getItem("user") || "null");

    // se ainda não tiver user salvo, tenta pegar pelo email do cadastro (fallback simples)
    if (!user?.id) {
      setStatus(cadastroStatus, "Não encontrei o ID do usuário. Faça login e tente novamente.");
      return;
    }

    const res = await fetch(`${API_BASE_URL}/auth/${user.id}`, {
      method: "DELETE",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return setStatus(cadastroStatus, data.erro || "Erro ao excluir conta.");
    }

    // limpa sessão e volta pro login limpo
    localStorage.removeItem("user");
    setStatus(cadastroStatus, "Conta excluída com sucesso ✅");

    // reset visual do modal
    btnExcluirConta.classList.add("hidden");
    btnSalvarDados.classList.remove("hidden");

  } catch (err) {
    console.error(err);
    setStatus(cadastroStatus, "Falha de conexão ao excluir.");
  }
});


// ===== ESQUECI MINHA SENHA =====
document.getElementById("esqueciSenha")?.addEventListener("click", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email")?.value.trim();
  const linkEsqueci = document.getElementById("esqueciSenha");

  if (!email) {
    return setStatus(loginStatus, "Digite seu email para recuperar a senha.", "error");
  }

  try {
    if (linkEsqueci) {
      linkEsqueci.style.pointerEvents = "none";
      linkEsqueci.style.opacity = "0.7";
    }

    setStatus(loginStatus, "Enviando link de redefinição...", "info");

    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return setStatus(loginStatus, data.erro || "Erro ao solicitar redefinição de senha.", "error");
    }

    setStatus(loginStatus, data.mensagem || "Confira seu email.", "success");
  } catch (error) {
    console.error(error);
    setStatus(loginStatus, "Falha de conexão ao solicitar redefinição de senha.", "error");
  } finally {
    if (linkEsqueci) {
      linkEsqueci.style.pointerEvents = "";
      linkEsqueci.style.opacity = "";
    }
  }
});


// ===== LOGIN =====
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus(loginStatus, "", "info");

  const email = document.getElementById("email")?.value.trim();
  const senha = document.getElementById("senha")?.value;
  const btnEntrar = document.getElementById("btnEntrar");

  if (!email || !senha) {
    return setStatus(loginStatus, "Informe email e senha.", "error");
  }

  try {
    setButtonLoading(btnEntrar, true, "Entrando...", "Entrar");

    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return setStatus(loginStatus, data.erro || "Email ou senha inválidos.", "error");
    }

    // opcional: guardar usuário logado no navegador (AC2 simples)
    localStorage.setItem("user", JSON.stringify(data.user));

    setStatus(loginStatus, "Login realizado com sucesso ✅ Redirecionando...", "success");
    
    setTimeout(() => {
      window.location.href = "/";
    }, 900);

  } catch (err) {
    console.error(err);
    setStatus(loginStatus, "Falha de conexão ao fazer login.", "error");
  } finally {
    setButtonLoading(btnEntrar, false, "Entrando...", "Entrar");
  }
});