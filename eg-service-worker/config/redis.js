const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

const connectRedis = async () => {
  try {
    await redis.ping();
    console.log('Redis connection established');
  } catch (error) {
    console.error('Redis connection failed:', error);
    throw error;
  }
}

module.exports = {
  connectRedis,
  redis,
}
