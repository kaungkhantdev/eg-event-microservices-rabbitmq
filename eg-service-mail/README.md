# EG Service Mail

Email notification service that processes email jobs from a Redis queue and sends templated emails using Nodemailer.

## Features

- BullMQ queue consumer for email jobs
- SMTP email sending with Nodemailer
- Handlebars template support
- Health check endpoint with queue monitoring
- Graceful shutdown handling

## Technology Stack

- **Framework**: Express.js v5
- **Queue**: BullMQ with ioredis
- **Email**: Nodemailer
- **Templates**: Handlebars
- **Environment**: dotenv

## Prerequisites

- Node.js v14+
- Redis v6+
- SMTP server (Gmail, SendGrid, etc.)

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
PORT=3004
NODE_ENV=development

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

### Gmail Setup

If using Gmail:

1. Enable 2-factor authentication
2. Generate an App Password: [Google Account > Security > App passwords](https://myaccount.google.com/apppasswords)
3. Use the app password in `SMTP_PASSWORD`

### Other SMTP Providers

- **SendGrid**: `SMTP_HOST=smtp.sendgrid.net`, `SMTP_PORT=587`
- **Mailgun**: `SMTP_HOST=smtp.mailgun.org`, `SMTP_PORT=587`
- **Amazon SES**: `SMTP_HOST=email-smtp.region.amazonaws.com`, `SMTP_PORT=587`

## Email Templates

Templates are stored in the `templates/` directory using Handlebars syntax.

### Creating Templates

Create `.hbs` files in `templates/`:

```handlebars
<!-- templates/event-created.hbs -->
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Event Created: {{name}}</h1>
        <p><strong>Date:</strong> {{date}}</p>
        <p><strong>Location:</strong> {{location}}</p>
        <p><strong>Description:</strong> {{description}}</p>
        <p><strong>Organizer:</strong> {{organizer}}</p>
    </div>
</body>
</html>
```

### Template Variables

Templates receive event data as variables:
- `{{name}}` - Event name
- `{{date}}` - Event date
- `{{location}}` - Event location
- `{{description}}` - Event description
- `{{organizer}}` - Event organizer
- `{{email}}` - Recipient email

## Running the Service

### Production Mode

```bash
npm start
```

### Development Mode (with auto-reload)

```bash
npm run dev
```

The health endpoint will be available on `http://localhost:3004` (or the PORT specified in .env).

## API Endpoints

### Health Check

Returns service health status, Redis connection, and queue statistics.

```http
GET /health
```

**Response** (200 OK):
```json
{
  "status": "healthy",
  "service": "mail-service",
  "dependencies": {
    "redis": true
  },
  "queue": {
    "waiting": 0,
    "active": 0,
    "completed": 5,
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
  "service": "mail-service",
  "error": "Connection error message"
}
```

## Queue Processing

The service listens to the `mail-queue` queue in Redis and processes email jobs.

### Job Structure

Jobs are added by the API service with this structure:

```javascript
{
  event: {
    id: 1,
    name: "Tech Conference 2025",
    date: "2025-06-15",
    location: "San Francisco",
    description: "Annual technology conference",
    organizer: "TechCorp",
    email: "contact@techconf.com"
  }
}
```

### Processing Flow

1. Job received from `mail-queue`
2. Template loaded from `templates/` directory
3. Template compiled with event data
4. Email sent via SMTP
5. Job marked as completed or failed

### Retry Logic

BullMQ automatically retries failed jobs:
- Failed jobs are retried with exponential backoff
- Maximum retry attempts: 3 (configurable)
- Retry delay: 5 seconds, 10 seconds, 20 seconds

## Project Structure

```
eg-service-mail/
├── config/
│   └── redis.js             # Redis connection
├── services/
│   ├── mail.service.js      # Email sending logic
│   └── queue.service.js     # Queue consumer setup
├── templates/
│   └── *.hbs                # Handlebars email templates
├── .env.example
├── .gitignore
├── package.json
└── server.js                # Main entry point
```

## Monitoring

### Queue Statistics

Monitor queue health via the `/health` endpoint:

```bash
curl http://localhost:3004/health | jq
```

### Logs

The service logs:
- Service startup and shutdown
- Email sending success/failure
- Queue job processing
- Redis connection status

## Error Handling

### Email Sending Failures

If email sending fails:
1. Error is logged to console
2. Job is marked as failed
3. BullMQ retries the job automatically
4. After max retries, job moves to failed queue

### Common Issues

**Authentication failed**
- Verify SMTP credentials
- Check if 2FA is enabled (use app password)
- Ensure SMTP host and port are correct

**Connection timeout**
- Check SMTP host and port
- Verify network/firewall settings
- Try different SMTP_SECURE setting (true/false)

**Template not found**
- Ensure template file exists in `templates/` directory
- Check template filename matches code
- Verify file has `.hbs` extension

## Development

### Testing Email Sending

1. Start the mail service
2. Use the API service to create an event
3. Check mail service logs for processing
4. Verify email received at recipient address

### Using Mailtrap for Testing

For development, use [Mailtrap](https://mailtrap.io/) to test emails without sending real emails:

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-username
SMTP_PASSWORD=your-mailtrap-password
```

## Graceful Shutdown

The service handles shutdown signals:

```bash
# SIGTERM or SIGINT (Ctrl+C)
```

On shutdown:
1. Stops accepting new jobs
2. Completes processing current jobs
3. Closes Redis connection
4. Exits process

## Dependencies

### Production
- `express`: Web framework
- `dotenv`: Environment configuration
- `ioredis`: Redis client
- `bullmq`: Queue management
- `nodemailer`: Email sending
- `handlebars`: Template engine
- `nodemon`: Auto-reload (also used in production for convenience)

## Troubleshooting

### Cannot connect to Redis

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Check Redis connection from Node.js
node -e "const Redis = require('ioredis'); const redis = new Redis(); redis.ping().then(console.log);"
```

### Emails not sending

1. Check SMTP credentials in `.env`
2. Verify SMTP server allows connections
3. Check mail service logs for errors
4. Test SMTP settings with a mail client
5. Ensure templates exist and are valid

### Queue not processing jobs

1. Verify Redis connection
2. Check if queue name matches between services
3. Monitor `/health` endpoint for queue stats
4. Check for errors in service logs

### Jobs stuck in queue

```bash
# Check queue status
curl http://localhost:3004/health

# If jobs are stuck, restart the service
npm restart
```

## License

ISC
