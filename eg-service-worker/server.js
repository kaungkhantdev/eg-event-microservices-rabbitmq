require('dotenv').config();
const express = require('express');
const { connectDB, db } = require('./config/database');
const { connectRedis, redis } = require('./config/redis');
const { checkElasticsearchConnection, initializeIndex } = require('./config/elasticsearch');
const elasticsearchWorker = require('./services/queue.service');

const app = express();
const HEALTH_PORT = process.env.HEALTH_PORT || 3005;

const startWorker = async () => {
  try {
    await connectDB();
    await connectRedis();
    await checkElasticsearchConnection();
    await initializeIndex();

    app.get('/health', async (req, res) => {
      try {
        const dbHealthy = await db.raw('SELECT 1').then(() => true).catch(() => false);
        const redisHealthy = await redis.ping() === 'PONG';
        const jobCounts = await elasticsearchWorker.getJobCounts();

        const isHealthy = dbHealthy && redisHealthy;

        res.status(isHealthy ? 200 : 503).json({
          status: isHealthy ? 'healthy' : 'unhealthy',
          service: 'worker',
          dependencies: {
            database: dbHealthy,
            redis: redisHealthy,
            elasticsearch: esHealthy,
          },
          queue: jobCounts,
        });
      } catch (err) {
        res.status(503).json({ status: 'unhealthy', error: err.message });
      }
    });

    const server = app.listen(HEALTH_PORT, () =>
      console.log(`✓ Health endpoint on ${HEALTH_PORT}`)
    );

    const shutdown = async () => {
      console.log('Shutting down worker...');
      await elasticsearchWorker.close();
      server.close();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    console.log('✓ Worker started');
  } catch (err) {
    console.error('✗ Worker failed', err);
    process.exit(1);
  }
};

startWorker();
