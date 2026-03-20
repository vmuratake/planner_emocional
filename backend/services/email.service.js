const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: process.env.BREVO_USER, 
    pass: process.env.BREVO_API_KEY,
  },
});


async function sendEmail({ to, subject, html }) {
  try {
    console.log("📨 Tentando enviar email para:", to);

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: "Planner Emocional",
          email: "noreply@diariodebordo.net.br"
        },
        to: [
          {
            email: to
          }
        ],
        subject,
        htmlContent: html,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("❌ Erro Brevo API:", data);
      throw new Error(data.message || "Erro ao enviar email");
    }

    console.log("✅ Email enviado com sucesso:", data);
    return data;
  } catch (error) {
    console.error("❌ Erro real ao enviar email:", error);
    throw error;
  }
}

module.exports = { sendEmail };