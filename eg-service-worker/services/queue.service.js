const { Worker } = require('bullmq');
const { redis } = require('../config/redis');
const { syncEventToElasticsearch } = require('../processors/elasticSync.processor');


const elasticsearchWorker = new Worker(
  'elasticsearchQueue',
  async (job) => {
    if (job.name !== 'syncToElasticsearch') return;

    console.log(`Processing job ${job.id} (Attempt ${job.attemptsMade + 1})`);
    return await syncEventToElasticsearch(job.data);
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
elasticsearchWorker.on('completed', (job, result) => {
  console.log(`✓ Job ${job.id} completed`, result);
});

elasticsearchWorker.on('failed', (job, err) => {
  console.error(`✗ Job ${job?.id} failed after ${job?.attemptsMade} attempts:`, err.message);
});

elasticsearchWorker.on('error', (err) => {
  console.error('✗ Worker error', err);
});

module.exports = elasticsearchWorker;
