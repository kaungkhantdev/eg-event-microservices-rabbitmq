# EG Service API

REST API service for event management. This service handles event creation, validation, storage, and job queuing for downstream processing.

## Features

- Event creation with validation
- Event retrieval
- PostgreSQL database integration
- Redis queue integration (BullMQ)
- Elasticsearch integration
- Job dispatching for worker and mail services

## Technology Stack

- **Framework**: Express.js v5
- **Database**: PostgreSQL with Knex.js
- **Queue**: BullMQ with ioredis
- **Search**: Elasticsearch
- **Validation**: Joi
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
PORT=3000
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

## Database Setup

Run migrations to create database tables:

```bash
npm run migrate
```

### Creating New Migrations

```bash
npm run migrate:make <migration_name>
```

Example:
```bash
npm run migrate:make add_events_table
```

## Running the Service

### Production Mode

```bash
npm start
```

### Development Mode (with auto-reload)

```bash
npm run dev
```

The service will start on `http://localhost:3000` (or the PORT specified in .env).

## API Endpoints

### Create Event

Creates a new event and dispatches jobs to worker and mail services.

```http
POST /api/events
Content-Type: application/json

{
  "name": "Tech Conference 2025",
  "date": "2025-06-15",
  "location": "San Francisco",
  "description": "Annual technology conference",
  "organizer": "TechCorp",
  "email": "contact@techconf.com"
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "name": "Tech Conference 2025",
  "date": "2025-06-15T00:00:00.000Z",
  "location": "San Francisco",
  "description": "Annual technology conference",
  "organizer": "TechCorp",
  "email": "contact@techconf.com",
  "created_at": "2025-12-31T10:30:00.000Z",
  "updated_at": "2025-12-31T10:30:00.000Z"
}
```

### Get All Events

Retrieves all events from the database.

```http
GET /api/events
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "Tech Conference 2025",
    "date": "2025-06-15T00:00:00.000Z",
    "location": "San Francisco",
    "description": "Annual technology conference",
    "organizer": "TechCorp",
    "email": "contact@techconf.com",
    "created_at": "2025-12-31T10:30:00.000Z",
    "updated_at": "2025-12-31T10:30:00.000Z"
  }
]
```

### Health Check

```http
GET /
```

**Response**:
```
Hello World!
```

## Validation

Events are validated using Joi schema. Required fields:

- `name` (string, required)
- `date` (date, required)
- `location` (string, required)
- `description` (string, optional)
- `organizer` (string, required)
- `email` (email format, required)

## Project Structure

```
eg-service-api/
├── config/
│   ├── database.js          # PostgreSQL connection
│   ├── redis.js             # Redis connection
│   └── elasticsearch.js     # Elasticsearch client
├── controllers/
│   └── event.controller.js  # Event route handlers
├── middleware/
│   ├── errorHandler.js      # Error handling middleware
│   └── validator.js         # Joi validation middleware
├── migrations/
│   └── [timestamp]_create_events_table.js
├── repository/
│   └── event.repository.js  # Data access layer
├── services/
│   ├── event.service.js     # Business logic
│   └── queue.service.js     # Queue management
├── .env.example
├── .gitignore
├── events.http              # REST client test file
├── knexfile.js              # Knex configuration
├── package.json
└── server.js                # Main entry point
```

## Queue Integration

When an event is created, two jobs are dispatched:

1. **Elasticsearch Queue** (`elasticsearch-queue`): Indexes the event for search
2. **Mail Queue** (`mail-queue`): Sends email notification

Jobs are processed by:
- `eg-service-worker` (Elasticsearch indexing)
- `eg-service-mail` (Email notifications)

## Error Handling

The service includes custom error handling middleware:

- **404 Not Found**: Routes that don't exist
- **500 Internal Server Error**: Unhandled exceptions
- **400 Bad Request**: Validation errors

## Testing

Use the included `events.http` file with a REST client (VS Code REST Client, Postman, etc.):

```http
### Create Event
POST http://localhost:3000/api/events
Content-Type: application/json

{
  "name": "Test Event",
  "date": "2025-07-01",
  "location": "New York",
  "description": "Test description",
  "organizer": "Test Org",
  "email": "test@example.com"
}

### Get All Events
GET http://localhost:3000/api/events
```

## Development Workflow

1. Make changes to code
2. Service auto-reloads (in dev mode)
3. Test using `events.http` or curl
4. Create migrations if database schema changes
5. Update validation schema if needed

## Dependencies

### Production
- `express`: Web framework
- `dotenv`: Environment configuration
- `knex`: SQL query builder
- `pg`: PostgreSQL client
- `ioredis`: Redis client
- `bullmq`: Queue management
- `joi`: Validation
- `@elastic/elasticsearch`: Elasticsearch client

### Development
- `nodemon`: Auto-reload on file changes

## Troubleshooting

### Cannot connect to database

- Verify PostgreSQL is running: `pg_isready`
- Check database credentials in `.env`
- Ensure database exists: `createdb event_management`

### Cannot connect to Redis

- Verify Redis is running: `redis-cli ping`
- Check Redis host and port in `.env`

### Cannot connect to Elasticsearch

- Verify Elasticsearch is running: `curl http://localhost:9200`
- Check Elasticsearch URL in `.env`

### Validation errors

- Ensure all required fields are provided
- Check date format (YYYY-MM-DD)
- Verify email format is valid

## License

ISC
