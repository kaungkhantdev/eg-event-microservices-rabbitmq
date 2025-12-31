const knex = require('knex');

const config = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  }
};
const db = knex(config);


const connectDB = async () => {
  try {
    await db.raw('SELECT 1+1 AS result');
    console.log('Database connection established');
    return db;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

module.exports = {
  connectDB,
  db
};
