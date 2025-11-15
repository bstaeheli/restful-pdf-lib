# Quick Start Guide

Get up and running with the PDF Library Web Service in 5 minutes.

## Installation

1. **Clone and install:**

```bash
git clone <repository-url>
cd restful-pdf-lib
npm install
```

2. **Configure environment:**

```bash
cp .env.example .env
```

Edit `.env` and set a strong API secret:

```env
API_SECRET=your-secure-secret-token-here
PORT=3000
NODE_ENV=development
```

Generate a secure secret:

```bash
openssl rand -base64 32
```

3. **Start development server:**

```bash
npm run dev
```

Service available at: `http://localhost:3000`

## First API Call

### Health Check (No Auth)

```bash
curl http://localhost:3000/health
```

### Extract PDF Fields

```bash
curl -X POST http://localhost:3000/api/pdf/extract-fields \
  -H "Authorization: your-secret-from-env" \
  -F "pdf=@path/to/your-form.pdf"
```

### Fill PDF Form

```bash
curl -X POST http://localhost:3000/api/pdf/fill-form \
  -H "Authorization: your-secret-from-env" \
  -F "pdf=@path/to/your-form.pdf" \
  -F 'fields={"fieldName":"value","checkbox":true}' \
  --output filled-form.pdf
```

## Interactive API Documentation

Open Swagger UI in your browser:

```
http://localhost:3000/api-docs
```

Features:
- Try API calls directly from browser
- See request/response examples
- Test authentication
- View all schemas

## Testing

```bash
# Run all tests
npm test

# Watch mode (for development)
npm run test:watch

# Coverage report
npm run test:coverage
```

## Docker Quick Start

### Using Pre-built Image

```bash
docker pull ghcr.io/<your-username>/restful-pdf-lib:latest

docker run -p 3000:3000 \
  -e API_SECRET=your-secret \
  ghcr.io/<your-username>/restful-pdf-lib:latest
```

### Build Locally

```bash
npm run docker:build
npm run docker:run
```

### Docker Compose

```bash
export API_SECRET=your-secret
docker-compose up -d
```

## Next Steps

- 📖 Read the [API Reference](api-reference.md) for detailed endpoint documentation
- 🚀 See [Deployment Guides](../deployment/) for production setup
- 🔧 Check [Configuration Guide](configuration.md) for advanced options
- 🐛 Review [Troubleshooting](troubleshooting.md) for common issues

## Common Commands

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm start                # Run production build

# Testing
npm test                 # Run tests once
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage

# Linting
npm run lint             # Check code style

# Docker
npm run docker:build     # Build image
npm run docker:run       # Run container
```

## Project Structure

```
restful-pdf-lib/
├── src/
│   ├── routes/         # API endpoints
│   ├── services/       # Business logic
│   ├── middleware/     # Auth & error handling
│   └── types/          # TypeScript types
├── docs/               # Documentation
├── .env                # Environment config
└── package.json        # Dependencies
```

## Need Help?

- Check [Troubleshooting Guide](troubleshooting.md)
- Review [API Reference](api-reference.md)
- See example requests in Swagger UI
