const express = require('express')
const cors = require('cors')
const { pool, testConnection } = require('./db')
const app = express()
const PORT = 3000


//rotas
app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
    res.status(200).json({ ok: true, service: 'planner_emocional_api'})
})

app.get('/', (req, res) => {
    res.send('API do Diário de Bordo funcionando')
})

app.get('/checkins', async (req, res) => {
    try {
        const sql = `
        SELECT
            id,
            data_checkin,
            nivel_energia,
            peso_mental,
            mente_texto,
            necessidade,
            pequena_vitoria,
            created_at
        FROM tbcheckin
        ORDER BY data_checkin DESC, id DESC    
        `
        const [rows] = await pool.query(sql)
        res.status(200).json(rows)
    } catch (error) {
        console.error('Erro ao listar checkins:', error.message)
        res.status(500).json({ erro: 'Erro interno ao listar checkins'})
    }
})


testConnection()

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`)
})