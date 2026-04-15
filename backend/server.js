const path = require("path");
const express = require("express");
const cors = require("cors");
const { testConnection } = require("./db");

const checkinRoutes = require("./routes/checkin.routes");
const loginRoutes = require("./routes/login.routes");

console.log("✅ SERVER.JS CARREGADO:", __filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares PRIMEIRO
app.use(cors());
app.use(express.json());

// logger
app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

// Frontend estático
app.use(express.static(path.join(__dirname, "frontend")));

// páginas
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "frontend", "pages", "checkin.html"))
);

app.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "frontend", "pages", "login.html"))
);

app.get("/reset-password", (req, res) =>
  res.sendFile(path.join(__dirname, "frontend", "pages", "reset-password.html"))
);

// API
app.get("/health", (req, res) =>
  res.status(200).json({ ok: true, service: "planner_emocional_api" })
);

app.use("/checkins", checkinRoutes);
app.use("/auth", loginRoutes);

testConnection();
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));