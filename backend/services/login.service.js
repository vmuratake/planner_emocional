const bcrypt = require("bcrypt");
const { pool } = require("../db");
const crypto = require("crypto");
const { sendEmail } = require("./email.service");
const baseUrl = process.env.APP_BASE_URL;

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
  return { 
    deleted: result.affectedRows > 0,
    affectedRows: result.affectedRows
  };
}

// atualizar perfil por id (PUT /auth/:id)
async function updateProfile(id, { nome, data_nascimento, senha }) {

  let sql = `
    UPDATE tbLogin
    SET nome = ?, data_nascimento = ?
  `;

  const valores = [nome, data_nascimento];

  // se veio senha → atualiza também
  if (senha) {
    const senha_hash = await bcrypt.hash(String(senha), 10);
    sql += `, senha_hash = ?`;
    valores.push(senha_hash);
  }

  sql += ` WHERE id = ?`;
  valores.push(id);

  const [result] = await pool.query(sql, valores);

  return { updated: result.affectedRows > 0 };
}


// ESQUECI MINHA SENHA
async function createResetToken(email) {
  const user = await findByEmail(email);

  if (!user) {
    const err = new Error("EMAIL_NAO_CADASTRADO");
    err.code = "EMAIL_NAO_CADASTRADO";
    throw err;
  }

  // invalida qualquer token anterior explicitamente, regra: 1)apaga token anterior; 2)gera novo token;
  //3)salva novo token; 4)envia link novo
  await pool.query(
    "UPDATE tbLogin SET reset_token = NULL, reset_token_expira = NULL WHERE id = ?",
    [user.id]
  );

  const token = crypto.randomBytes(32).toString("hex");

  await pool.query(
    "UPDATE tbLogin SET reset_token = ?, reset_token_expira = DATE_ADD(NOW(), INTERVAL 30 MINUTE) WHERE id = ?",
    [token, user.id]
  );

  const link = `${baseUrl}/reset-password?token=${token}`;
  console.log("LINK FINAL:", link);
  console.log("TOKEN GERADO:", token);

  try {
    await sendEmail({
      to: user.email,
      subject: "Redefinição de senha",
      html: `
      <h3>Redefinir senha</h3>
      <p>Clique no link abaixo:</p>
      <a href="${link}">${link}</a>
    `,
    });
  } catch (error) {
    // limpa token se o envio falhar
    await pool.query(
      "UPDATE tbLogin SET reset_token = NULL, reset_token_expira = NULL WHERE id = ?",
      [user.id]
    );
    throw error;
  }
}


// redefinir senha usando token
async function resetPassword(token, novaSenha) {
  console.log("TOKEN RECEBIDO NO RESET:", token);

  const [rows] = await pool.query(
    "SELECT id, reset_token, reset_token_expira FROM tbLogin WHERE reset_token = ? LIMIT 1",
    [token]
  );

  console.log("ROWS RESET:", rows);

  if (!rows.length) {
    throw new Error("TOKEN_INVALIDO");
  }

  const userId = rows[0].id;
  const senha_hash = await bcrypt.hash(String(novaSenha), 10);

  await pool.query(
    `UPDATE tbLogin
     SET senha_hash = ?, reset_token = NULL, reset_token_expira = NULL
     WHERE id = ?`,
    [senha_hash, userId]
  );
}

module.exports = { findByEmail, register, deleteById, createResetToken, resetPassword, updateProfile };