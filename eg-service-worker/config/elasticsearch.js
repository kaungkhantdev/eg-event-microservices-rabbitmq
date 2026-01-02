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

const initializeIndex = async () => {
  const indexName = process.env.ELASTICSEARCH_INDEX || 'events';

  try {
    const indexExists = await esClient.indices.exists({ index: indexName });

    if (!indexExists) {
      await esClient.indices.create({
        index: indexName,
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 1,
            analysis: {
              analyzer: {
                event_analyzer: {
                  type: 'standard',
                  stopwords: '_english_'
                }
              }
            }
          },
          mappings: {
            properties: {
              id: { type: 'keyword' },
              title: {
                type: 'text',
                analyzer: 'event_analyzer',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              description: {
                type: 'text',
                analyzer: 'event_analyzer'
              },
              location: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              startDate: { type: 'date' },
              endDate: { type: 'date' },
              category: { type: 'keyword' },
              organizer: { type: 'keyword' },
              maxAttendees: { type: 'integer' },
              status: { type: 'keyword' },
              metadata: { type: 'object', enabled: true },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' }
            }
          }
        },
      });
      console.log(`Elasticsearch index "${indexName}" created.`);
    } else {
      console.log(`Elasticsearch index "${indexName}" already exists.`);
    }

  } catch (error) {
    console.error('Error initializing Elasticsearch index:', error);
    throw error;
  }

}


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
  INDEX_NAME: process.env.ELASTICSEARCH_INDEX || 'events',
  initializeIndex,
};