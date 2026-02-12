const mysql = require('mysql2/promise')
require('dotenv').config()

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})


async function testConnection() {
    try {
        const conn = await pool.getConnection()
        console.log('Conexão com MySQL OK')
        conn.release()
    } catch (error) {
        console.error('Erro ao conectar no MySQL:', error.message)
    }
}

module.exports = { pool, testConnection }