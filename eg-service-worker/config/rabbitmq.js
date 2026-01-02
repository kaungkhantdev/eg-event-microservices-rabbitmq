const amqp = require('amqplib');

let channel;
let connection;

const connectRabbitMQ = async () => {
  if(channel) return channel;

  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    console.log('RabbitMQ connected successfully');

    channel = await connection.createChannel();

    // Exchange ( fanout for pub/sub )
    await channel.assertExchange('app.events', 'fanout', { durable: true });

    // Queues per service
    await channel.assertQueue('sync.queue', { durable: true });

    // Bind queues to exchange
    await channel.bindQueue('sync.queue', 'app.events', '');

    // Handle connection errors
    connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err);
      channel = null;
      connection = null;
    });

    connection.on('close', () => {
      console.log('RabbitMQ connection closed');
      channel = null;
      connection = null;
    });

    return channel;
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    throw error;
  }
}

const getConnection = () => connection;

module.exports = {
  connectRabbitMQ,
  getConnection,
};
