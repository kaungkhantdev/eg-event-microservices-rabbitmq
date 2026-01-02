const { Worker } = require('bullmq');
const { redis } = require('../config/redis');
const { processNewEvent } = require('../services/mail.service');

const mailWorker = new Worker(
  'eventQueue',
  async (job) => {
    if (job.name !== 'processEvent') return;

    console.log(`Processing job ${job.id} (Attempt ${job.attemptsMade + 1})`);
    return await processNewEvent(job.data);
  },
  {
    connection: redis,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
    settings: {
      backoffStrategy: (attemptsMade) => {
        return Math.min(Math.pow(2, attemptsMade) * 1000, 30000);
      },
    },
  }
);

// Worker events
mailWorker.on('completed', (job, result) => {
  console.log(`✓ Job ${job.id} completed`, result);
});

mailWorker.on('failed', (job, err) => {
  console.error(`✗ Job ${job?.id} failed after ${job?.attemptsMade} attempts:`, err.message);
});

mailWorker.on('error', (err) => {
  console.error('✗ Worker error', err);
});

module.exports = mailWorker;
