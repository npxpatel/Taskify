/**
 * Email Worker
 * Standalone process that consumes the email_notifications queue
 * and sends emails asynchronously, independent of the API server.
 *
 * Run with: node src/workers/emailWorker.js
 */

const { connectRabbitMQ, disconnectRabbitMQ, consumeQueue, QUEUES } = require('../services/rabbitmq');
const { sendOtpEmail, sendMail } = require('../services/mailer');
const { connectDB, disconnectDB } = require('../config/database');

async function handleEmailMessage(payload) {
  const { type, to, data } = payload;

  switch (type) {
    case 'otp':
      await sendOtpEmail(to, data.otp);
      console.log(`[emailWorker] OTP email sent to ${to}`);
      break;

    case 'generic':
      await sendMail({ to, subject: data.subject, html: data.html, text: data.text });
      console.log(`[emailWorker] Generic email sent to ${to}`);
      break;

    default:
      console.warn(`[emailWorker] Unknown email type "${type}" — skipping`);
  }
}

async function start() {
  // DB connection needed if future handlers query MongoDB
  await connectDB();
  await connectRabbitMQ();

  console.log('[emailWorker] Listening on queue:', QUEUES.EMAIL_NOTIFICATIONS);

  await consumeQueue(QUEUES.EMAIL_NOTIFICATIONS, handleEmailMessage);
}

async function shutdown(signal) {
  console.log(`\n[emailWorker] ${signal} received — shutting down`);
  await Promise.allSettled([disconnectRabbitMQ(), disconnectDB()]);
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('[emailWorker] Unhandled rejection:', reason);
});

start();
