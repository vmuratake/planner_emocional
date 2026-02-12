const express = require('express')
const cors = require('cors')
const { testConnection } = require('./db')
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

testConnection()

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`)
})