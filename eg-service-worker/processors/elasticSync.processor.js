const { getEventById } = require('../repository/event.repository');
const { esClient } = require('../config/elasticsearch');
const { INDEX_NAME } = require('../config/elasticsearch');

const syncEventToElasticsearch = async (jobData) => {
  const { operation, eventId, data } = jobData;

  if (!operation || !eventId) {
    throw new Error('Missing required fields: operation and eventId are required');
  }

  try {
    switch (operation) {
      case 'create':
      case 'update':
        let eventData = data;
        if (!eventData && eventId) {
          const event = await getEventById(eventId);
          eventData = event.toJSON();
        }

        await esClient.index({
          index: INDEX_NAME,
          id: eventData.id,
          document: {
            id: eventData.id,
            title: eventData.title,
            description: eventData.description,
            location: eventData.location,
            startDate: eventData.startDate,
            endDate: eventData.endDate,
            category: eventData.category,
            organizer: eventData.organizer,
            maxAttendees: eventData.maxAttendees,
            status: eventData.status,
            metadata: eventData.metadata,
            createdAt: eventData.createdAt,
            updatedAt: eventData.updatedAt,
          },
        });
        console.log(`✓ Event ${eventId} ${operation}d in Elasticsearch`);
        break;
      case 'delete':
        await esClient.delete({
          index: INDEX_NAME,
          id: eventId,
        });
        console.log(`✓ Event ${eventId} deleted from Elasticsearch`);
        break;

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    console.log(`Event with ID ${eventId} indexed successfully.`);
  } catch (error) {
    console.error(`Error indexing event with ID ${eventId}:`, error);
    throw error;
  }
};

module.exports = {
  syncEventToElasticsearch,
};