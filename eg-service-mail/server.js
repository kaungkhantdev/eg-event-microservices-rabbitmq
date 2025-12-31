require('dotenv').config();
const express = require('express');
const { connectRedis, redis } = require('./config/redis');
const mailWorker = require('./services/queue.service');

const app = express();
const PORT = process.env.PORT || 3004;

const startServer = async () => {
  try {
    await connectRedis();

    app.get('/health', async (req, res) => {
      try {
        const redisHealthy = await redis.ping() === 'PONG';
        const jobCounts = await mailWorker.getJobCounts();

        res.status(redisHealthy ? 200 : 503).json({
          status: redisHealthy ? 'healthy' : 'unhealthy',
          service: 'mail-service',
          dependencies: {
            redis: redisHealthy,
          },
          queue: jobCounts,
        });
      } catch (err) {
        res.status(503).json({
          status: 'unhealthy',
          service: 'mail-service',
          error: err.message
        });
      }
    });

    const server = app.listen(PORT, () => {
      console.log(`✓ Mail service health endpoint running on port ${PORT}`);
    });

    const shutdown = async () => {
      console.log('Shutting down mail service...');
      await mailWorker.close();
      server.close();
      await redis.quit();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    console.log('✓ Mail service started');
  } catch (err) {
    console.error('✗ Mail service failed to start:', err);
    process.exit(1);
  }
};

startServer();
