const bcrypt = require("bcrypt");
const { pool } = require("../db");
const crypto = require("crypto");
const { sendEmail } = require("./email.service");

// busca por email (usado no login)
async function findByEmail(email) {
  const emailNorm = String(email).trim().toLowerCase();

  const sql = `
    SELECT id, nome, email, senha_hash, data_nascimento
    FROM tbLogin
    WHERE email = ?
    LIMIT 1
  `;
  const [rows] = await pool.query(sql, [emailNorm]);
  return rows[0] || null;
}

// cria conta (register)
async function register({ nome, email, senha, data_nascimento }) {
  const emailNorm = String(email).trim().toLowerCase();

  // verifica se email já existe
  const [existe] = await pool.query(
    "SELECT id FROM tbLogin WHERE email = ? LIMIT 1",
    [emailNorm]
  );

  if (existe.length > 0) {
    const err = new Error("Email já cadastrado");
    err.code = "EMAIL_JA_CADASTRADO";
    throw err;
  }

  // hash da senha
  const senha_hash = await bcrypt.hash(String(senha), 10);

  const sql = `
    INSERT INTO tbLogin (nome, email, senha_hash, data_nascimento)
    VALUES (?, ?, ?, ?)
  `;
  const valores = [nome, emailNorm, senha_hash, data_nascimento];

  const [result] = await pool.query(sql, valores);
  return { id: result.insertId };
}

// excluir conta por id (DELETE /auth/:id)
async function deleteById(id) {
  const sql = "DELETE FROM tbLogin WHERE id = ?";
  const [result] = await pool.query(sql, [id]);

  // result.affectedRows = 1 se deletou, 0 se não achou
  return { deleted: result.affectedRows > 0 };
}


// ESQUECI MINHA SENHA
async function createResetToken(email) {
  const user = await findByEmail(email);
    if (!user) {
    const err = new Error("EMAIL_NAO_CADASTRADO");
    err.code = "EMAIL_NAO_CADASTRADO";
    throw err;
  } 

  const token = crypto.randomBytes(32).toString("hex");
  const expira = new Date(Date.now() + 1000 * 60 * 30); // 30 min

  await pool.query(
    "UPDATE tbLogin SET reset_token = ?, reset_token_expira = ? WHERE id = ?",
    [token, expira, user.id]
  );

  const link = `http://localhost:3000/reset-password?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: "Redefinição de senha",
    html: `
      <h3>Redefinir senha</h3>
      <p>Clique no link abaixo:</p>
      <a href="${link}">${link}</a>
    `,
  });
}


// redefinir senha usando token
async function resetPassword(token, novaSenha) {
  const [rows] = await pool.query(
    "SELECT id FROM tbLogin WHERE reset_token = ? AND reset_token_expira > NOW()",
    [token]
  );

  if (!rows.length) {
    throw new Error("TOKEN_INVALIDO");
  }

  const userId = rows[0].id;

  const senha_hash = await bcrypt.hash(novaSenha, 10);

  await pool.query(
    `UPDATE tbLogin 
     SET senha_hash = ?, reset_token = NULL, reset_token_expira = NULL
     WHERE id = ?`,
    [senha_hash, userId]
  );
}

module.exports = { findByEmail, register, deleteById, createResetToken, resetPassword };