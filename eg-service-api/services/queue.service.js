const { Queue } = require('bullmq');
const { redisConnection } = require('../config/redis');

const eventQueue = new Queue('eventQueue', {
  connection: redisConnection,
});

const elasticsearchQueue = new Queue('elasticsearchQueue', {
  connection: redisConnection,
});

const addEventToQueue = async (eventData) => {
  try {
    await eventQueue.add('processEvent', eventData);
  } catch (error) {
    console.error('Error adding event to queue:', error);
    throw error;
  }
}

const addEventToElasticsearchQueue = async (eventData) => {
  try {
    await elasticsearchQueue.add('syncToElasticsearch', eventData);
  } catch (error) {
    console.error('Error adding event to Elasticsearch queue:', error);
    throw error;
  }
} 

module.exports = {
  addEventToQueue,
  addEventToElasticsearchQueue
}