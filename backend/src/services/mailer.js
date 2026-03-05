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

async function sendReminderEmail(to, { name, staleJobs }) {
  const jobRows = staleJobs
    .map(
      (j) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${j.company}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${j.role}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280">${j.daysSinceUpdate} days ago</td>
        </tr>`
    )
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
      <h2 style="color:#111827;margin-bottom:4px">Job application update reminder</h2>
      <p style="color:#374151">Hi ${name}, you have <strong>${staleJobs.length}</strong> application(s) with no updates in over 14 days:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:8px 12px;text-align:left;font-size:13px;color:#6b7280">Company</th>
            <th style="padding:8px 12px;text-align:left;font-size:13px;color:#6b7280">Role</th>
            <th style="padding:8px 12px;text-align:left;font-size:13px;color:#6b7280">Last updated</th>
          </tr>
        </thead>
        <tbody>${jobRows}</tbody>
      </table>
      <p style="color:#6b7280;font-size:13px">Log in to Taskify to update their status.</p>
    </div>
  `;

  await sendMail({
    to,
    subject: `Taskify — ${staleJobs.length} application(s) need your attention`,
    html,
    text: `Hi ${name}, you have ${staleJobs.length} job application(s) with no updates in over 14 days. Log in to Taskify to update them.`,
  });
}

module.exports = { sendMail, sendOtpEmail, sendReminderEmail };
