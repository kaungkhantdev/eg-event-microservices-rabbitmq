# EG Event Services

A microservices-based event management system built with Node.js, featuring event creation, asynchronous processing, and email notifications.

## Architecture Overview

This project consists of three independent microservices that work together to handle event management:

```
┌─────────────────┐
│   eg-service-   │  REST API for event management
│      api        │  Ports: 3000
└────────┬────────┘
         │
         ├─> PostgreSQL (Event storage)
         ├─> Redis (Queue management)
         └─> Elasticsearch (Event indexing)
              ↓
         ┌────────────────┐
         │ eg-service-    │  Background worker for Elasticsearch
         │    worker      │  Ports: 3005 (health)
         └────────────────┘
              ↓
         ┌────────────────┐
         │ eg-service-    │  Email notification service
         │     mail       │  Ports: 3004 (health)
         └────────────────┘
```

### Services

- **[eg-service-api](./eg-service-api/README.md)**: REST API service for creating and retrieving events
- **[eg-service-worker](./eg-service-worker/README.md)**: Background worker that processes events and indexes them to Elasticsearch
- **[eg-service-mail](./eg-service-mail/README.md)**: Email service that sends notifications using templates

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Queue**: BullMQ with Redis
- **Search**: Elasticsearch
- **Email**: Nodemailer with Handlebars templates
- **Validation**: Joi

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- Redis (v6 or higher)
- Elasticsearch (v7 or higher)

## Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd eg-event-services
```

### 2. Setup each service

```bash
# Setup API Service
cd eg-service-api
cp .env.example .env
npm install
npm run migrate
cd ..

# Setup Worker Service
cd eg-service-worker
cp .env.example .env
npm install
cd ..

# Setup Mail Service
cd eg-service-mail
cp .env.example .env
npm install
cd ..
```

### 3. Configure environment variables

Edit the `.env` file in each service directory with your actual configuration values.

### 4. Start the services

Open three separate terminal windows and run:

```bash
# Terminal 1 - API Service
cd eg-service-api
npm start

# Terminal 2 - Worker Service
cd eg-service-worker
npm start

# Terminal 3 - Mail Service
cd eg-service-mail
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Service Endpoints

### API Service (Port 3000)

- `POST /api/events` - Create a new event
- `GET /api/events` - Get all events
- `GET /` - Health check

### Worker Service (Port 3005)

- `GET /health` - Health check with queue status

### Mail Service (Port 3004)

- `GET /health` - Health check with queue status

## Event Flow

1. Client sends POST request to create an event via API service
2. API service validates and stores event in PostgreSQL
3. API service adds two jobs to Redis queues:
   - Elasticsearch indexing job
   - Email notification job
4. Worker service processes Elasticsearch job and indexes the event
5. Mail service processes email job and sends notification

## Project Structure

```
eg-event-services/
├── eg-service-api/          # REST API service
│   ├── config/              # Database, Redis, Elasticsearch config
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Validation and error handling
│   ├── migrations/          # Database migrations
│   ├── repository/          # Data access layer
│   ├── services/            # Business logic and queue setup
│   └── server.js            # Main entry point
│
├── eg-service-worker/       # Background worker
│   ├── config/              # Database, Redis, Elasticsearch config
│   ├── processors/          # Job processors
│   ├── repository/          # Data access layer
│   ├── services/            # Queue consumer setup
│   └── server.js            # Main entry point
│
└── eg-service-mail/         # Email service
    ├── config/              # Redis config
    ├── services/            # Email and queue services
    ├── templates/           # Handlebars email templates
    └── server.js            # Main entry point
```

## Development

### Running migrations

```bash
cd eg-service-api
npm run migrate
```

### Creating new migrations

```bash
cd eg-service-api
npm run migrate:make <migration_name>
```

### Testing the API

Use the included `events.http` file in the API service for testing with REST client.

## Health Monitoring

Each service provides health check endpoints:

- API Service: `http://localhost:3000/`
- Worker Service: `http://localhost:3005/health`
- Mail Service: `http://localhost:3004/health`

Health endpoints return service status and dependency health (database, Redis, queue stats).

## Troubleshooting

### Services won't start

- Ensure PostgreSQL, Redis, and Elasticsearch are running
- Check `.env` configuration in each service
- Verify port availability (3000, 3004, 3005)

### Events not being processed

- Check Redis connection in all services
- Monitor queue status via health endpoints
- Check worker service logs for processing errors

### Emails not sending

- Verify SMTP configuration in mail service `.env`
- Check mail service logs for connection errors
- Ensure email templates exist in `templates/` directory

## License

ISC
