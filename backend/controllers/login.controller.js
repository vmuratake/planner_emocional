const loginService = require("../services/login.service");
const bcrypt = require("bcrypt");

// POST /auth/register
async function register(req, res) {
  try {
    const { nome, email, senha, data_nascimento } = req.body;

    if (!nome || !email || !senha || !data_nascimento) {
      return res.status(400).json({
        erro: "Campos obrigatórios: nome, email, senha, data_nascimento",
      });
    }
    
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailValido.test(String(email).trim())) {
      return res.status(400).json({
        erro: "Email inválido"
      });
    }

    const result = await loginService.register({
      nome,
      email,
      senha,
      data_nascimento,
    });

    return res.status(201).json({
      mensagem: "Conta criada com sucesso",
      id: result.id,
    });
  } catch (error) {
    if (error.code === "EMAIL_JA_CADASTRADO") {
      return res.status(409).json({ erro: "Este email já está cadastrado" });
    }

    console.error("Erro ao criar conta:", error.message);
    return res.status(500).json({ erro: "Erro interno ao criar conta" });
  }
}

// POST /auth/login
async function login(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: "Campos obrigatórios: email, senha" });
    }

    const user = await loginService.findByEmail(email);
    if (!user) {
      return res.status(404).json({ erro: "Email não cadastrado. Crie uma conta" });
    }

    const ok = await bcrypt.compare(String(senha), user.senha_hash);
    if (!ok) {
      return res.status(401).json({ erro: "Email ou senha inválidos" });
    }

    return res.status(200).json({
      mensagem: "Login OK",
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        data_nascimento: user.data_nascimento,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error.message);
    return res.status(500).json({ erro: "Erro interno ao fazer login" });
  }
}


// POST /auth/:id (exclusão de conta)
async function deleteAccount(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ erro: "ID inválido" });
    }

    const result = await loginService.deleteById(Number(id));

    if (!result.deleted) {
      return res.status(404).json({ erro: "Conta não encontrada" });
    }

    return res.status(200).json({ mensagem: "Conta excluída com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir conta:", error.message);
    return res.status(500).json({ erro: "Erro interno ao excluir conta" });
  }
}


// PUT /auth/:id (atualização de perfil)
async function updateProfile(req, res) {
  try {
    const { id } = req.params;
    const { nome, data_nascimento } = req.body;

    if (!nome || !data_nascimento) {
      return res.status(400).json({
        erro: "Campos obrigatórios: nome, data_nascimento"
      });
    }

    const result = await loginService.updateProfile(id, {
      nome,
      data_nascimento
    });

    if (!result.updated) {
      return res.status(404).json({
        erro: "Usuário não encontrado"
      });
    }

    return res.status(200).json({
      mensagem: "Perfil atualizado com sucesso"
    });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return res.status(500).json({
      erro: "Erro interno ao atualizar perfil"
    });
  }
}


// POST Esqueci minha senha
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ erro: "Email obrigatório" });
    }

    await loginService.createResetToken(email);

    return res.status(200).json({
      mensagem: "Enviamos um link de redefinição para o seu email.",
    });
  } catch (error) {
    if (error.code === "EMAIL_NAO_CADASTRADO") {
      return res.status(404).json({ erro: "Email não cadastrado. Crie uma conta para realizar login." });
    }

    console.error("Erro em forgotPassword:", error.message);
    return res.status(500).json({ erro: "Erro ao processar solicitação" });
  }
}

// POST Redefinir senha
async function resetPassword(req, res) {
  try {
    const { token, senha } = req.body;

    if (!token || !senha) {
      return res.status(400).json({ erro: "Token e senha são obrigatórios" });
    }

    await loginService.resetPassword(token, senha);

    return res.status(200).json({
      mensagem: "Senha atualizada com sucesso",
    });
  } catch (error) {
    if (error.message === "TOKEN_INVALIDO") {
      return res.status(400).json({ erro: "Token inválido ou expirado" });
    }

    return res.status(500).json({ erro: "Erro ao redefinir senha" });
  }
}

module.exports = { register, login, deleteAccount, forgotPassword, resetPassword, updateProfile };