const { createApp }       = require('./app');
const { env }             = require('./config/env');
const { connectDB, disconnectDB }         = require('./config/database');
const { connectRedis, disconnectRedis }   = require('./services/redis');
const { connectRabbitMQ, disconnectRabbitMQ } = require('./services/rabbitmq');
const { startStaleJobReminder } = require('./jobs/staleJobReminder');

async function bootstrap() {
  await connectDB();
  await connectRedis();
  await connectRabbitMQ();

  // Start cron jobs
  startStaleJobReminder();

  const app = createApp();

  const server = app.listen(Number(env.PORT), () => {
    console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  async function shutdown(signal) {
    console.log(`\n${signal} received — shutting down gracefully`);

    // Stop accepting new connections
    server.close(async () => {
      await Promise.allSettled([
        disconnectDB(),
        disconnectRedis(),
        disconnectRabbitMQ(),
      ]);
      console.log('Shutdown complete');
      process.exit(0);
    });

    // Force exit after 10 seconds if graceful shutdown stalls
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
  });
}

bootstrap();
