import path from "path";
import { fileURLToPath } from "url";

const express = require('express')
const cors = require('cors')
const { pool, testConnection } = require('./db')
const app = express()
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// serve o frontend (pasta ../frontend)
app.use(express.static(path.resolve(__dirname, "../frontend")));

// rota raiz abre o index.html
app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../frontend/index.html"));
});


//rotas
app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
    res.status(200).json({ ok: true, service: 'planner_emocional_api' })
})

app.get('/', (req, res) => {
    res.send('API do Diário de Bordo funcionando')
})

//GET
app.get('/checkins', async (req, res) => {
    try {
        const sql = `
            SELECT
                id,
                data_checkin,
                nivel_energia,
                peso_mental,
                ocupa_mente,
                necessidade,
                pequena_vitoria,
                created_at
            FROM tbcheckin
            ORDER BY data_checkin DESC, id DESC
            `;
        const [rows] = await pool.query(sql)
        res.status(200).json(rows)
    } catch (error) {
        console.error('Erro ao listar checkins:', error.message)
        res.status(500).json({ erro: 'Erro interno ao listar checkins' })
    }
})

//GET por DATA
app.get('/checkins/by-date/:data', async (req, res) => {
    const { data } = req.params

    try {
        const sql = `
            SELECT
                id,
                data_checkin,
                nivel_energia,
                peso_mental,
                ocupa_mente,
                necessidade,
                pequena_vitoria,
                created_at
            FROM tbcheckin
            ORDER BY data_checkin DESC, id DESC
            `;
        const [rows] = await pool.query(sql, [data])

        if (!rows.length) {
            return res.status(404).json({ erro: "Não existe check-in para essa data" });
        }

        return res.status(200).json(rows[0])
    } catch (error) {
        console.error('Erro ao buscar checkins por data:', error.message)
        res.status(500).json({ erro: 'Erro interno ao buscar checkins por data' })
    }
})


//POST
app.post('/checkins', async (req, res) => {
    try {
        const {
            data_checkin,
            nivel_energia,
            peso_mental,
            ocupa_mente,
            necessidade,
            pequena_vitoria
        } = req.body;

        const ENERGIA = ['MUITO_CANSADA', 'CANSADA', 'OK', 'BEM', 'EM_PAZ']
        const NECESSIDADES = ['DESCANSO', 'MOVIMENTO', 'SILENCIO', 'CONVERSA', 'ORACAO', 'ORGANIZACAO']

        if (
            !data_checkin ||
            !nivel_energia ||
            !necessidade ||
            !peso_mental ||
            !ocupa_mente ||
            !pequena_vitoria
        ) {
            return res.status(400).json({
                erro: 'Campos obrigatórios: data_checkin, nivel_energia, necessidade, peso_mental, ocupa_mente, pequena_vitoria'
            });
        }

        if (!ENERGIA.includes(nivel_energia)) {
            return res.status(400).json({ erro: 'nivel_energia inválido' })
        }

        if (!NECESSIDADES.includes(necessidade)) {
            return res.status(400).json({ erro: 'necessidade inválida' })
        }

        const sql = `
  INSERT INTO tbcheckin
  (data_checkin, nivel_energia, peso_mental, ocupa_mente, necessidade, pequena_vitoria)
  VALUES (?, ?, ?, ?, ?, ?)
`;

        const valores = [
            data_checkin,
            nivel_energia,
            peso_mental,
            ocupa_mente,
            necessidade,
            pequena_vitoria
        ];

        const [result] = await pool.query(sql, valores);

        return res.status(201).json({
            mensagem: 'Check-in criado com sucesso',
            id: result.insertId
        })
    } catch (error) {
        //tratamento para o erro de Unique Key da data
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                erro: 'Já existe check-in para essa data'
            })
        }

        // enum inválido / valor fora do domínio
        if (
            error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' ||
            error.code === 'WARN_DATA_TRUNCATED'
        ) {
            return res.status(400).json({ erro: 'Valor inválido em nível de energia ou necessidade' })
        }

        console.error('Erro ao criar checkin:', error.message)
        return res.status(500).json({ erro: 'Erro interno ao criar checkin' })
    }
})


testConnection()

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});