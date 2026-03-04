const amqp = require('amqplib');
const { env } = require('../config/env');

let connection = null;
let channel    = null;

const QUEUES = {
  EMAIL_NOTIFICATIONS: 'email_notifications',
  JOB_REMINDERS:       'job_reminders',
  BACKGROUND_TASKS:    'background_tasks',
};

async function connectRabbitMQ() {
  try {
    connection = await amqp.connect(env.RABBITMQ_URL);
    channel    = await connection.createChannel();

    // Fair dispatch — don't give a worker more than one unacknowledged message
    await channel.prefetch(1);

    for (const queue of Object.values(QUEUES)) {
      await channel.assertQueue(queue, { durable: true });
    }

    connection.on('error', (err) => console.error('RabbitMQ connection error:', err));
    connection.on('close', () => console.warn('RabbitMQ connection closed'));

    console.log('RabbitMQ connected');
  } catch (error) {
    console.warn('RabbitMQ unavailable — queue features disabled:', error.message);
    connection = null;
    channel    = null;
  }
}

async function disconnectRabbitMQ() {
  try {
    if (channel)    await channel.close();
    if (connection) await connection.close();
    console.log('RabbitMQ disconnected');
  } catch (err) {
    console.error('Error disconnecting RabbitMQ:', err);
  }
}

function isRabbitMQConnected() {
  return channel !== null;
}

function publish(queue, payload) {
  if (!channel) {
    console.warn(`RabbitMQ not connected — dropping message for queue "${queue}"`);
    return false;
  }
  const content = Buffer.from(JSON.stringify(payload));
  return channel.sendToQueue(queue, content, { persistent: true });
}

function publishEmailNotification(payload) {
  return publish(QUEUES.EMAIL_NOTIFICATIONS, payload);
}

function publishJobReminder(payload) {
  return publish(QUEUES.JOB_REMINDERS, payload);
}

function publishBackgroundTask(payload) {
  return publish(QUEUES.BACKGROUND_TASKS, payload);
}

async function consumeQueue(queue, handler) {
  if (!channel) {
    console.warn(`RabbitMQ not connected — cannot consume queue "${queue}"`);
    return;
  }

  await channel.consume(queue, async (msg) => {
    if (!msg) return;

    try {
      const payload = JSON.parse(msg.content.toString());
      await handler(payload);
      channel.ack(msg);
    } catch (err) {
      console.error(`Error processing message from queue "${queue}":`, err);
      // requeue=false prevents poison-pill loops
      channel.nack(msg, false, false);
    }
  });
}

module.exports = {
  connectRabbitMQ,
  disconnectRabbitMQ,
  isRabbitMQConnected,
  publish,
  publishEmailNotification,
  publishJobReminder,
  publishBackgroundTask,
  consumeQueue,
  QUEUES,
};
