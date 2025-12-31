require('dotenv').config();
const express = require('express');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { checkElasticsearchConnection } = require('./config/elasticsearch');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express()
const PORT = process.env.PORT || 3000;

app.use(express.json())
app.use(express.urlencoded({ extended: true }))


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use(errorHandler);
app.use(notFound);

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();
    await checkElasticsearchConnection();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}
startServer();