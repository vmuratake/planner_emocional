const bcrypt = require("bcrypt");
const { pool } = require("../db");

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

module.exports = { register, findByEmail };