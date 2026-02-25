const mysql = require('mysql2/promise')
require('dotenv').config()

const pool = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: Number(process.env.MYSQLPORT || 3306),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})


async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log("✅ Conectado ao MySQL (Railway) com sucesso!");
  } catch (err) {
    console.error("❌ Erro ao conectar no MySQL:", err.message);
  }
}

module.exports = { pool, testConnection };