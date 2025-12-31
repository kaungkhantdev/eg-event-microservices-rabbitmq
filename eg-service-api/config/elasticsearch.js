const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme',
  },
  ssl: {
    rejectUnauthorized: false,
  },
});

const checkElasticsearchConnection = async () => {
  try {
    await esClient.ping();
    console.log('Elasticsearch cluster is up!');
    const health = await esClient.cluster.health();
    console.log('✓ Elasticsearch connected:', health.cluster_name);

  } catch (error) {
    console.error('Elasticsearch cluster is down!', error.message);
    throw error;
  }
}

module.exports = {
  esClient,
  checkElasticsearchConnection,
  INDEX_NAME: process.env.ELASTICSEARCH_INDEX || 'events'
};