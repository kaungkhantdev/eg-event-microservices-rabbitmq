# EG Service Worker

Background worker service that processes event indexing jobs from a Redis queue and indexes events into Elasticsearch for search functionality.

## Features

- BullMQ queue consumer for Elasticsearch indexing jobs
- Automatic Elasticsearch index creation and mapping
- Event indexing with full-text search support
- Health check endpoint with dependency monitoring
- Graceful shutdown handling
- Database and Redis connection management

## Technology Stack

- **Framework**: Express.js v5
- **Database**: PostgreSQL with Knex.js
- **Queue**: BullMQ with ioredis
- **Search**: Elasticsearch
- **Environment**: dotenv

## Prerequisites

- Node.js v14+
- PostgreSQL v12+
- Redis v6+
- Elasticsearch v7+

## Installation

```bash
npm install
```

## Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

### Environment Variables

```env
PORT=3005
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=event_management
DB_USER=postgres
DB_PASS=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=
ELASTICSEARCH_INDEX=events
```

## Elasticsearch Setup

### Index Creation

The service automatically creates the Elasticsearch index with the following mapping on startup:

```json
{
  "mappings": {
    "properties": {
      "id": { "type": "integer" },
      "name": { "type": "text" },
      "date": { "type": "date" },
      "location": { "type": "text" },
      "description": { "type": "text" },
      "organizer": { "type": "text" },
      "email": { "type": "keyword" },
      "created_at": { "type": "date" },
      "updated_at": { "type": "date" }
    }
  }
}
```

### Index Name

Default index name is `events` (configurable via `ELASTICSEARCH_INDEX` environment variable).

## Running the Service

### Production Mode

```bash
npm start
```

### Development Mode (with auto-reload)

```bash
npm run dev
```

The health endpoint will be available on `http://localhost:3005` (or the PORT specified in .env).

## API Endpoints

### Health Check

Returns service health status, dependency connections, and queue statistics.

```http
GET /health
```

**Response** (200 OK):
```json
{
  "status": "healthy",
  "service": "worker",
  "dependencies": {
    "database": true,
    "redis": true,
    "elasticsearch": true
  },
  "queue": {
    "waiting": 0,
    "active": 0,
    "completed": 15,
    "failed": 0,
    "delayed": 0,
    "paused": 0
  }
}
```

**Response** (503 Service Unavailable) - when unhealthy:
```json
{
  "status": "unhealthy",
  "service": "worker",
  "dependencies": {
    "database": false,
    "redis": true,
    "elasticsearch": true
  },
  "queue": {
    "waiting": 2,
    "active": 0,
    "completed": 10,
    "failed": 1
  }
}
```

## Queue Processing

The service listens to the `elasticsearch-queue` queue in Redis and processes indexing jobs.

### Job Structure

Jobs are added by the API service with this structure:

```javascript
{
  eventId: 1
}
```

### Processing Flow

1. Job received from `elasticsearch-queue` with event ID
2. Event data fetched from PostgreSQL database
3. Event indexed to Elasticsearch
4. Job marked as completed or failed

### Indexing Process

1. Retrieve event from database by ID
2. Transform event data for Elasticsearch
3. Index document using `client.index()` API:
   ```javascript
   {
     index: 'events',
     id: eventId,
     body: eventData
   }
   ```
4. Log success or error

### Retry Logic

BullMQ automatically retries failed jobs:
- Failed jobs are retried with exponential backoff
- Maximum retry attempts: 3 (configurable)
- Retry delay: 5 seconds, 10 seconds, 20 seconds

## Project Structure

```
eg-service-worker/
├── config/
│   ├── database.js          # PostgreSQL connection
│   ├── redis.js             # Redis connection
│   └── elasticsearch.js     # Elasticsearch client & setup
├── processors/
│   └── elasticsearch.processor.js  # Job processing logic
├── repository/
│   └── event.repository.js  # Data access layer
├── services/
│   └── queue.service.js     # Queue consumer setup
├── .env.example
├── .gitignore
├── package.json
└── server.js                # Main entry point
```

## Monitoring

### Health Monitoring

Monitor service health via the `/health` endpoint:

```bash
curl http://localhost:3005/health | jq
```

This provides:
- Overall service status
- Database connection status
- Redis connection status
- Elasticsearch connection status
- Queue statistics (waiting, active, completed, failed jobs)

### Logs

The service logs:
- Service startup and shutdown
- Index creation/verification
- Job processing success/failure
- Database and Elasticsearch operations
- Connection status for all dependencies

## Elasticsearch Operations

### Searching Indexed Events

Once events are indexed, you can search them directly in Elasticsearch:

```bash
# Search all events
curl -X GET "localhost:9200/events/_search?pretty"

# Search by name
curl -X GET "localhost:9200/events/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": {
      "name": "conference"
    }
  }
}
'

# Search by location
curl -X GET "localhost:9200/events/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": {
      "location": "San Francisco"
    }
  }
}
'
```

### Index Management

```bash
# Check if index exists
curl -X GET "localhost:9200/events?pretty"

# Get index mapping
curl -X GET "localhost:9200/events/_mapping?pretty"

# Delete index (be careful!)
curl -X DELETE "localhost:9200/events?pretty"
```

## Error Handling

### Indexing Failures

If indexing fails:
1. Error is logged to console
2. Job is marked as failed
3. BullMQ retries the job automatically
4. After max retries, job moves to failed queue

### Common Issues

**Event not found in database**
- Event may have been deleted
- Event ID may be invalid
- Database connection issue

**Elasticsearch connection failed**
- Verify Elasticsearch is running
- Check ELASTICSEARCH_NODE URL
- Verify network/firewall settings

**Index creation failed**
- Check Elasticsearch version compatibility
- Verify user permissions
- Check Elasticsearch logs

## Development

### Testing the Worker

1. Start the worker service
2. Use the API service to create an event
3. Check worker logs for processing
4. Verify event is indexed in Elasticsearch:
   ```bash
   curl http://localhost:9200/events/_search?pretty
   ```

### Manual Job Processing

You can manually add jobs to the queue for testing:

```javascript
const { Queue } = require('bullmq');
const Redis = require('ioredis');

const connection = new Redis({
  host: 'localhost',
  port: 6379
});

const queue = new Queue('elasticsearch-queue', { connection });

// Add a job
await queue.add('index-event', { eventId: 1 });
```

## Graceful Shutdown

The service handles shutdown signals:

```bash
# SIGTERM or SIGINT (Ctrl+C)
```

On shutdown:
1. Stops accepting new jobs
2. Completes processing current jobs
3. Closes database connection
4. Closes Redis connection
5. Exits process

## Performance Considerations

### Bulk Indexing

For indexing multiple events, consider using Elasticsearch bulk API:

```javascript
const bulk = events.flatMap(event => [
  { index: { _index: 'events', _id: event.id } },
  event
]);

await esClient.bulk({ body: bulk });
```

### Index Settings

Optimize index settings for your use case:

```javascript
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1,
    "refresh_interval": "1s"
  }
}
```

## Dependencies

### Production
- `express`: Web framework
- `dotenv`: Environment configuration
- `knex`: SQL query builder
- `pg`: PostgreSQL client
- `ioredis`: Redis client
- `bullmq`: Queue management
- `@elastic/elasticsearch`: Elasticsearch client

### Development
- `nodemon`: Auto-reload on file changes

## Troubleshooting

### Cannot connect to database

```bash
# Check if PostgreSQL is running
pg_isready

# Test database connection
psql -h localhost -U postgres -d event_management -c "SELECT 1;"
```

### Cannot connect to Redis

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG
```

### Cannot connect to Elasticsearch

```bash
# Check if Elasticsearch is running
curl http://localhost:9200
# Should return cluster info

# Check cluster health
curl http://localhost:9200/_cluster/health?pretty
```

### Jobs not processing

1. Verify all dependencies are connected (check `/health`)
2. Check Redis queue has jobs
3. Ensure queue name matches between services
4. Monitor logs for processing errors
5. Check database for event data

### Events not searchable

1. Verify index exists: `curl http://localhost:9200/events`
2. Check index has documents: `curl http://localhost:9200/events/_count`
3. Verify mapping is correct: `curl http://localhost:9200/events/_mapping`
4. Check worker processed jobs successfully

### High memory usage

- Reduce number of concurrent jobs in queue configuration
- Optimize Elasticsearch mapping
- Use pagination for large result sets
- Monitor with Elasticsearch monitoring tools

## License

ISC
