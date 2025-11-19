# RESTful PDF Library

## Project Overview
This is a REST API web service for PDF manipulation using pdf-lib. The service provides endpoints to extract form fields from PDFs and fill PDF forms with data.

## Technology Stack
- Node.js with TypeScript
- Express.js for REST API
- pdf-lib for PDF manipulation
- Jest for testing
- Docker for containerization
- Azure Container Instances for deployment

## Authentication
All endpoints require authentication using a secret token passed via the `Authorization` header.
The secret is configured via the `API_SECRET` environment variable.

## Development Guidelines
- All code and documentation must be in English
- Follow test-driven development practices
- Use TypeScript strict mode
- All dependencies must be open-source with permissive licenses
- Write comprehensive tests for all endpoints
- Follow REST API best practices

## Documentation Standards
- Keep documentation concise and to the point
- No emojis in documentation
- Avoid general knowledge explanations (Docker basics, Git workflows, etc.)
- Focus on project-specific information only
- Assume readers have basic technical knowledge

## Available Endpoints
- `POST /api/pdf/extract-fields` - Upload a PDF and get form fields as JSON
- `POST /api/pdf/fill-form` - Upload a PDF and JSON data to fill the form

## Testing
Run tests with `npm test`. Tests must pass in the CI/CD pipeline.

## Docker
The service runs in a Docker container and is designed for Azure Container Instances deployment.
