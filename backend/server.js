const path = require("path");
const express = require("express");
const cors = require("cors");
const { pool, testConnection } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

// serve o frontend (pasta ../frontend)
app.use(express.static(path.join(__dirname, "frontend")));

// rota raiz abre o index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "index.html"));
});


// Middlewares
app.use(cors())
app.use(express.json())

// Health (API)
app.get('/health', (req, res) => {
    res.status(200).json({ ok: true, service: 'planner_emocional_api' })
})


// GET - listar checkins
app.get('/checkins', async (req, res) => {
    try {
        const sql = `
        SELECT
            id,
            data_checkin,
            energia_fisica,
            energia_mental,
            energia_emocional,
            energia_espiritual,
            energia_social,
            ocupou_mente,
            afetou_hoje,
            autocuidado,
            observacoes_livres,
            pequena_vitoria,
            horario_registro_local,
            created_at
        FROM tbcheckin
        ORDER BY data_checkin DESC, id DESC
        `;
        const [rows] = await pool.query(sql)
        res.status(200).json(rows)
    } catch (error) {
        console.error('Erro ao listar registros:', error.message)
        res.status(500).json({ erro: 'Erro interno ao listar registros' })
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
                energia_fisica,
                energia_mental,
                energia_emocional,
                energia_espiritual,
                energia_social,
                ocupou_mente,
                afetou_hoje,
                autocuidado,
                observacoes_livres,
                pequena_vitoria,
                horario_registro_local,
                created_at
                FROM tbcheckin
                WHERE data_checkin = ?
                ORDER BY id DESC
                LIMIT 1
            `;
        const [rows] = await pool.query(sql, [data])

        if (!rows.length) {
            return res.status(404).json({ erro: "Não existe registro para essa data" });
        }

        return res.status(200).json(rows[0])
    } catch (error) {
        console.error('Erro ao buscar registro por data:', error.message)
        res.status(500).json({ erro: 'Erro interno ao buscar registro por data' })
    }
})


//POST -  criar checkin
app.post('/checkins', async (req, res) => {
    try {
        const {
            data_checkin,

            energia_fisica,
            energia_mental,
            energia_emocional,
            energia_espiritual,
            energia_social,

            ocupou_mente,
            afetou_hoje,
            autocuidado,
            observacoes_livres,
            pequena_vitoria,
            horario_registro_local,
        } = req.body;

        // ✅ domínio (tem que bater com os ENUMs do MySQL)
        const ENERGIA_FISICA = ['ENERGIZADO', 'CANSADO', 'EXAUSTO', 'LEVE', 'PESADO', 'TENSO', 'RELAXADO'];
        const ENERGIA_MENTAL = ['CLARA', 'CONFUSA', 'ACELERADA', 'DISPERSA', 'FOCADA', 'SOBRECARREGADA', 'CRIATIVA'];
        const ENERGIA_EMOCIONAL = ['ESTAVEL', 'SENSIVEL', 'REATIVA', 'ACOLHEDORA', 'DEFENSIVA', 'VULNERAVEL', 'INSENSIVEL'];
        const ENERGIA_ESPIRITUAL = ['CONECTADA', 'DESCONECTADA', 'EM_PAZ', 'EM_CONFLITO', 'CONFIANTE', 'VAZIA', 'ESPERANCOSA'];
        const ENERGIA_SOCIAL = ['ABERTA', 'FECHADA', 'CONECTADA', 'ISOLADA', 'RECEPTIVA', 'IRRITAVEL', 'PROTETIVA'];

        // ✅ obrigatório mínimo
        if (
            !data_checkin ||
            !energia_fisica ||
            !energia_mental ||
            !energia_emocional ||
            !energia_espiritual ||
            !energia_social
        ) {
            return res.status(400).json({
                erro: "Campos obrigatórios: data_checkin, energia_fisica, energia_mental, energia_emocional, energia_espiritual, energia_social"
            });
        }

        // helper: valida só se veio preenchido
        const validarSePreenchido = (valor, dominio, campo) => {
            if (valor == null || String(valor).trim() === '') return null; // trata vazio como NULL
            if (!dominio.includes(valor)) {
                return { erro: `${campo} inválido` };
            }
            return valor;
        };

        // ✅ validações
        const vFisica = validarSePreenchido(energia_fisica, ENERGIA_FISICA, 'energia_fisica');
        if (vFisica?.erro) return res.status(400).json(vFisica);

        const vMental = validarSePreenchido(energia_mental, ENERGIA_MENTAL, 'energia_mental');
        if (vMental?.erro) return res.status(400).json(vMental);

        const vEmocional = validarSePreenchido(energia_emocional, ENERGIA_EMOCIONAL, 'energia_emocional');
        if (vEmocional?.erro) return res.status(400).json(vEmocional);

        const vEspiritual = validarSePreenchido(energia_espiritual, ENERGIA_ESPIRITUAL, 'energia_espiritual');
        if (vEspiritual?.erro) return res.status(400).json(vEspiritual);

        const vSocial = validarSePreenchido(energia_social, ENERGIA_SOCIAL, 'energia_social');
        if (vSocial?.erro) return res.status(400).json(vSocial);

        if (horario_registro_local && !/^\d{2}:\d{2}$/.test(horario_registro_local)) {
            return res.status(400).json({ erro: "horario_registro_local inválido (use HH:MM)" });
        }

        const sql = `
      INSERT INTO tbcheckin
      (
        data_checkin,
        energia_fisica,
        energia_mental,
        energia_emocional,
        energia_espiritual,
        energia_social,
        ocupou_mente,
        afetou_hoje,
        autocuidado,
        observacoes_livres,
        pequena_vitoria,
        horario_registro_local
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const valores = [
            data_checkin,
            vFisica,
            vMental,
            vEmocional,
            vEspiritual,
            vSocial,
            (ocupou_mente == null || String(ocupou_mente).trim() === '') ? null : ocupou_mente,
            (afetou_hoje == null || String(afetou_hoje).trim() === '') ? null : afetou_hoje,
            (autocuidado == null || String(autocuidado).trim() === '') ? null : autocuidado,
            (observacoes_livres == null || String(observacoes_livres).trim() === '') ? null : observacoes_livres,
            (pequena_vitoria == null || String(pequena_vitoria).trim() === '') ? null : pequena_vitoria,
            horario_registro_local,
        ];

        const [result] = await pool.query(sql, valores);

        return res.status(201).json({
            mensagem: 'Registro criado com sucesso',
            id: result.insertId
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ erro: 'Já existe registro para essa data' });
        }

        // enum inválido / valor fora do domínio (fallback)
        if (
            error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' ||
            error.code === 'WARN_DATA_TRUNCATED'
        ) {
            return res.status(400).json({ erro: 'Valor inválido em algum campo de energia' });
        }

        console.error('Erro ao criar registro:', error.message);
        return res.status(500).json({ erro: 'Erro interno ao criar registro' });
    }
});


testConnection()

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});