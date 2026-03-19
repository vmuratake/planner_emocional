const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://planneremocional-production.up.railway.app";

const resetForm = document.getElementById("resetForm");
const resetStatus = document.getElementById("resetStatus");
const novaSenhaEl = document.getElementById("novaSenha");
const confirmarNovaSenhaEl = document.getElementById("confirmarNovaSenha");

function setStatus(msg) {
  if (resetStatus) resetStatus.textContent = msg;
}

function getTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

resetForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus("");

  const token = getTokenFromUrl();
  const senha = novaSenhaEl?.value || "";
  const confirmar = confirmarNovaSenhaEl?.value || "";

  if (!token) {
    return setStatus("Token não encontrado na URL.");
  }

  if (!senha || !confirmar) {
    return setStatus("Preencha os dois campos de senha.");
  }

  if (senha.length < 6) {
    return setStatus("A nova senha deve ter no mínimo 6 caracteres.");
  }

  if (senha !== confirmar) {
    return setStatus("As senhas não conferem.");
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, senha }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return setStatus(data.erro || "Não foi possível redefinir a senha.");
    }

    setStatus("Senha atualizada com sucesso ✅ Redirecionando para o login...");

    setTimeout(() => {
      window.location.href = "/login";
    }, 1800);
  } catch (error) {
    console.error(error);
    setStatus("Falha de conexão ao redefinir a senha.");
  }
});