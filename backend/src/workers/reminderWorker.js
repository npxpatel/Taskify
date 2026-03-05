/**
 * Reminder Worker
 * Standalone process that consumes the job_reminders queue
 * and sends stale-job reminder emails to users.
 *
 * Run with: node src/workers/reminderWorker.js
 */

const { connectRabbitMQ, disconnectRabbitMQ, consumeQueue, QUEUES } = require('../services/rabbitmq');
const { sendReminderEmail } = require('../services/mailer');
const { connectDB, disconnectDB } = require('../config/database');

async function handleReminderMessage(payload) {
  const { to, name, staleJobs } = payload;

  if (!to || !staleJobs?.length) {
    console.warn('[reminderWorker] Invalid payload — skipping:', payload);
    return;
  }

  await sendReminderEmail(to, { name, staleJobs });
  console.log(`[reminderWorker] Reminder sent to ${to} (${staleJobs.length} stale job(s))`);
}

async function start() {
  await connectDB();
  await connectRabbitMQ();

  console.log('[reminderWorker] Listening on queue:', QUEUES.JOB_REMINDERS);

  await consumeQueue(QUEUES.JOB_REMINDERS, handleReminderMessage);
}

async function shutdown(signal) {
  console.log(`\n[reminderWorker] ${signal} received — shutting down`);
  await Promise.allSettled([disconnectRabbitMQ(), disconnectDB()]);
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('[reminderWorker] Unhandled rejection:', reason);
});

start();
