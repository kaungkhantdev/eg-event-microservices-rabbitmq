const { connectRabbitMQ } = require('../config/rabbitmq');

const publishEvent = async (payload) => {
  const channel = await connectRabbitMQ();

  channel.publish(
    'app.events',
    '',
    Buffer.from(JSON.stringify(payload)),
    { persistent: true }
  );
};

module.exports = {
  publishEvent
};