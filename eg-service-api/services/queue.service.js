const { Queue } = require('bullmq');
const { redisConnection } = require('../config/redis');

const eventQueue = new Queue('eventQueue', {
  connection: redisConnection,
});

const elasticsearchQueue = new Queue('elasticsearchQueue', {
  connection: redisConnection,
});

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000,
  },
  removeOnComplete: 1000,
  removeOnFail: 500,
};

const addEventToQueue = async (eventData) => {
  return eventQueue.add(
    'processEvent',
    eventData,
    {
      ...DEFAULT_JOB_OPTIONS,
      jobId: `event-${eventData.eventId}`, // idempotent
    }
  );
};

const addEventToElasticsearchQueue = async (eventData) => {
  return elasticsearchQueue.add(
    'syncToElasticsearch',
    eventData,
    {
      ...DEFAULT_JOB_OPTIONS,
      timeout: 60_000, // ES is slower
      jobId: `es-${eventData.eventId}`,
    }
  );
};

module.exports = {
  addEventToQueue,
  addEventToElasticsearchQueue,
};

