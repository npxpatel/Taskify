const nodemailer = require('nodemailer');
const { env } = require('../config/env');

// Singleton transporter — created once on first use
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (env.EMAIL_USER && env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS },
    });
  } else {
    console.warn('EMAIL_USER / EMAIL_PASS not set — emails will be logged to console only');
  }

  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  const transport = getTransporter();

  if (!transport) {
    console.log('[MAILER stub]', { to, subject, text: text ?? '(html only)' });
    return;
  }

  await transport.sendMail({
    from:    `"Taskify" <${env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text,
  });
}

async function sendOtpEmail(to, otp) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
      <h2 style="color:#111827;margin-bottom:8px">Your Taskify OTP</h2>
      <p style="color:#374151">Use the code below to reset your password. It expires in <strong>10 minutes</strong>.</p>
      <div style="font-size:36px;font-weight:700;letter-spacing:8px;text-align:center;padding:24px 0;color:#4f46e5">
        ${otp}
      </div>
      <p style="color:#6b7280;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  await sendMail({
    to:      to,
    subject: 'Taskify — password reset OTP',
    html,
    text:    `Your Taskify OTP is: ${otp}. It expires in 10 minutes.`,
  });
}

module.exports = { sendMail, sendOtpEmail };
