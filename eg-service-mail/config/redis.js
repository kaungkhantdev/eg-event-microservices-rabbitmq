require('dotenv').config();
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

const connectRedis = async () => {
  return new Promise((resolve, reject) => {
    redis.on('connect', () => {
      console.log('✓ Redis connected');
      resolve();
    });

    redis.on('error', (err) => {
      console.error('✗ Redis connection error:', err);
      reject(err);
    });
  });
};

module.exports = { redis, connectRedis };
