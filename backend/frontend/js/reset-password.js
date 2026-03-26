const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://planneremocional-production.up.railway.app";

const resetForm = document.getElementById("resetForm");
const resetStatus = document.getElementById("resetStatus");
const novaSenhaEl = document.getElementById("novaSenha");
const confirmarNovaSenhaEl = document.getElementById("confirmarNovaSenha");
const btnResetarSenha = document.getElementById("btnResetarSenha");

function setStatus(msg, type = "info") {
  if (!resetStatus) return;

  resetStatus.textContent = msg || "";
  resetStatus.classList.remove("is-success", "is-error", "is-info");

  if (type === "success") resetStatus.classList.add("is-success");
  else if (type === "error") resetStatus.classList.add("is-error");
  else resetStatus.classList.add("is-info");
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

function getTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

resetForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus("", "info");

  const token = getTokenFromUrl();
  const senha = novaSenhaEl?.value || "";
  const confirmar = confirmarNovaSenhaEl?.value || "";

  if (!token) {
    return setStatus("Token não encontrado na URL.", "error");
  }

  if (!senha || !confirmar) {
    return setStatus("Preencha os dois campos de senha.", "error");
  }

  if (senha.length < 6) {
    return setStatus("A nova senha deve ter no mínimo 6 caracteres.", "error");
  }

  if (senha !== confirmar) {
    return setStatus("As senhas não conferem.", "error");
  }

    try {
    setButtonLoading(btnResetarSenha, true, "Salvando...", "Salvar nova senha");


    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, senha }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return setStatus(data.erro || "Não foi possível redefinir a senha.", "error");
    }

    setStatus("Senha atualizada com sucesso ✅ Redirecionando para o login...", "success");

    setTimeout(() => {
      window.location.href = "/login";
    }, 1200);
  } catch (error) {
    console.error(error);
    setStatus("Falha de conexão ao redefinir a senha.", "error");
  } finally {
    setButtonLoading(btnResetarSenha, false, "Salvando...", "Salvar nova senha");
  }
});