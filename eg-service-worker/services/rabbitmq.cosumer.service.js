const { connectRabbitMQ } = require('../config/rabbitmq');
const { syncEventToElasticsearch } = require('../processors/elasticSync.processor');

const consumeEvents = async () => {
  try {
    const channel = await connectRabbitMQ();

    channel.consume('sync.queue', async (msg) => {
      if (msg !== null) {
        try {
          const event = JSON.parse(msg.content.toString());
          console.log('Received event in Sync Service:', event);
          await syncEventToElasticsearch(event);
          // Acknowledge message
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);

          // Reject message and requeue it
          channel.nack(msg, false, true);
        }
      }
    }, { noAck: false });
  } catch (error) {
    console.error('Error connecting to RabbitMQ or setting up consumer:', error);
    throw error;
  }
};

module.exports = {
  consumeEvents,
};