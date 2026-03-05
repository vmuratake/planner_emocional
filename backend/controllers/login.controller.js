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
      return res.status(401).json({ erro: "Email ou senha inválidos" });
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

module.exports = { register, login };