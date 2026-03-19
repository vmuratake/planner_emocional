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
  await transporter.sendMail({
    from: '"Planner Emocional" <vanessamuratake@gmail.com>',
    to,
    subject,
    html,
  });
}

module.exports = { sendEmail };