# RESTful PDF Library

![Docker Build](https://github.com/bstaeheli/restful-pdf-lib/actions/workflows/docker-publish.yml/badge.svg)

A REST API for PDF manipulation using [pdf-lib](https://pdf-lib.js.org). Extract form fields and fill PDF forms via HTTP endpoints.

## Quick Start

```bash
# Install
git clone https://github.com/bstaeheli/restful-pdf-lib.git
cd restful-pdf-lib
npm install

# Configure
cp .env.example .env
# Edit .env and set API_SECRET (generate with: openssl rand -base64 32)

# Run
npm run dev
```

🌐 **Service:** `http://localhost:3000`  
📚 **API Docs:** `http://localhost:3000/api-docs`

## API Endpoints

### Extract PDF Fields
```bash
curl -X POST http://localhost:3000/api/pdf/extract-fields \
  -H "Authorization: your-secret" \
  -F "pdf=@form.pdf"
```

### Fill PDF Form
```bash
curl -X POST http://localhost:3000/api/pdf/fill-form \
  -H "Authorization: your-secret" \
  -F "pdf=@form.pdf" \
  -F 'fields={"name":"John","email":"john@example.com"}' \
  --output filled.pdf
```

### Health Check (no auth)
```bash
curl http://localhost:3000/health
```

## Docker

```bash
# Use pre-built image
docker pull ghcr.io/bstaeheli/restful-pdf-lib:latest
docker run -p 3000:3000 -e API_SECRET=your-secret ghcr.io/bstaeheli/restful-pdf-lib:latest

# Or build locally
docker build -t restful-pdf-lib .
docker run -p 3000:3000 -e API_SECRET=your-secret restful-pdf-lib
```

## Azure Deployment

```bash
az container create \
  --resource-group myResourceGroup \
  --name restful-pdf-lib \
  --image ghcr.io/bstaeheli/restful-pdf-lib:latest \
  --cpu 1 --memory 1 \
  --dns-name-label pdf-service \
  --ports 3000 \
  --environment-variables NODE_ENV=production PORT=3000 \
  --secure-environment-variables API_SECRET=your-secret
```

## Development

```bash
npm run dev              # Start with hot reload
npm test                 # Run tests
npm run test:coverage    # Coverage report
npm run build            # Build for production
npm run lint             # Check code style
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_SECRET` | Yes | - | Authentication token |
| `PORT` | No | 3000 | Server port |
| `NODE_ENV` | No | production | Environment mode |

## Tech Stack

- **Node.js 20+** with TypeScript
- **Express.js** - Web framework
- **pdf-lib** - PDF manipulation (MIT)
- **Jest** - Testing
- **Docker** - Containerization
- **GitHub Actions** - CI/CD

## License

MIT - See [LICENSE](LICENSE) file
```

## API Documentation

### Interactive Swagger UI

Full interactive API documentation is available at:
```
http://localhost:3000/api-docs
```

The Swagger UI provides:
- Interactive API testing
- Request/response examples
- Schema definitions
- Authentication testing

### Endpoints Overview

#### Health Check

**GET** `/health`

Check if the service is running (no authentication required).

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Extract PDF Form Fields

**POST** `/api/pdf/extract-fields`

Upload a PDF file and extract all form fields as JSON.

**Headers:**
- `Authorization`: Your API secret
- `Content-Type`: `multipart/form-data`

**Body:**
- `pdf`: PDF file (form-data)

**Example using curl:**
```bash
curl -X POST http://localhost:3000/api/pdf/extract-fields \
  -H "Authorization: your-secret-token" \
  -F "pdf=@/path/to/your/form.pdf"
```

**Response:**
```json
{
  "fields": [
    {
      "name": "fullName",
      "type": "text",
      "value": "John Doe",
      "maxLength": 100
    },
    {
      "name": "agreeToTerms",
      "type": "checkbox",
      "value": true
    },
    {
      "name": "country",
      "type": "dropdown",
      "value": "USA",
      "options": ["USA", "Canada", "Mexico"]
    }
  ]
}
```

#### Fill PDF Form

**POST** `/api/pdf/fill-form`

Upload a PDF file and JSON data to fill the form fields.

**Headers:**
- `Authorization`: Your API secret
- `Content-Type`: `multipart/form-data`

**Body:**
- `pdf`: PDF file (form-data)
- `fields`: JSON string or object with field values

**Example using curl:**
```bash
curl -X POST http://localhost:3000/api/pdf/fill-form \
  -H "Authorization: your-secret-token" \
  -F "pdf=@/path/to/your/form.pdf" \
  -F 'fields={"fullName":"Jane Smith","agreeToTerms":true}' \
  --output filled-form.pdf
```

**Example field data:**
```json
{
  "fullName": "Jane Smith",
  "email": "jane@example.com",
  "agreeToTerms": true,
  "country": "Canada"
}
```

**Response:**
- Content-Type: `application/pdf`
- Returns the filled PDF file as a binary download

## Docker

### Using Pre-built Image from GitHub Container Registry

```bash
# Pull the latest image
docker pull ghcr.io/<your-username>/restful-pdf-lib:latest

# Run the container
docker run -p 3000:3000 \
  -e API_SECRET=your-secret-token \
  -e NODE_ENV=production \
  ghcr.io/<your-username>/restful-pdf-lib:latest
```

### Build Docker Image Locally

```bash
npm run docker:build
```

Or manually:
```bash
docker build -t restful-pdf-lib .
```

### Run Docker Container

```bash
npm run docker:run
```

Or manually:
```bash
docker run -p 3000:3000 \
  -e API_SECRET=your-secret-token \
  -e NODE_ENV=production \
  restful-pdf-lib
```

### Using Docker Compose

```bash
# Set your API secret in environment
export API_SECRET=your-secret-token

# Start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

## GitHub Actions CI/CD

This project uses GitHub Actions for automated testing and Docker image publishing.

### Automatic Workflow

When you push code to GitHub:
1. ✅ Tests run automatically
2. ✅ Docker image is built (multi-platform: amd64, arm64)
3. ✅ Image is pushed to GitHub Container Registry

### Pipeline Triggers

- **Push to `main` or `develop`** - Builds and publishes Docker image
- **Create tag `v*.*.*`** - Builds versioned release
- **Pull Request to `main`** - Runs tests only

### Accessing Built Images

```bash
# Latest version
docker pull ghcr.io/<your-username>/restful-pdf-lib:latest

# Specific version
docker pull ghcr.io/<your-username>/restful-pdf-lib:v1.0.0

# Specific branch
docker pull ghcr.io/<your-username>/restful-pdf-lib:main
```

See [GITHUB-ACTIONS.md](GITHUB-ACTIONS.md) for detailed documentation.

## Azure Deployment

### Option 1: Deploy from GitHub Container Registry (Recommended)

```bash
# Deploy using pre-built image from GHCR
az container create \
  --resource-group myResourceGroup \
  --name restful-pdf-lib \
  --image ghcr.io/<your-username>/restful-pdf-lib:latest \
  --cpu 1 \
  --memory 1 \
  --dns-name-label pdf-lib-service \
  --ports 3000 \
  --environment-variables NODE_ENV=production PORT=3000 \
  --secure-environment-variables API_SECRET=your-secret-token
```

### Option 2: Deploy from Azure Container Registry

1. **Build and push Docker image to Azure Container Registry:**

```bash
# Login to Azure
az login

# Create container registry (if not exists)
az acr create --resource-group myResourceGroup \
  --name myregistry --sku Basic

# Login to registry
az acr login --name myregistry

# Build and push
docker build -t myregistry.azurecr.io/restful-pdf-lib:latest .
docker push myregistry.azurecr.io/restful-pdf-lib:latest
```

2. **Deploy to Azure Container Instance:**

```bash
az container create \
  --resource-group myResourceGroup \
  --name restful-pdf-lib \
  --image myregistry.azurecr.io/restful-pdf-lib:latest \
  --cpu 1 \
  --memory 1 \
  --registry-login-server myregistry.azurecr.io \
  --registry-username <username> \
  --registry-password <password> \
  --dns-name-label pdf-lib-service \
  --ports 3000 \
  --environment-variables NODE_ENV=production PORT=3000 \
  --secure-environment-variables API_SECRET=your-secret-token
```

3. **Access your service:**

```
http://pdf-lib-service.<region>.azurecontainer.io:3000
```

### Azure DevOps Pipeline

The project includes an Azure DevOps pipeline configuration (`azure-pipelines.yml`) that:

1. Runs tests and linting
2. Builds Docker image
3. Pushes to Azure Container Registry
4. Deploys to Azure Container Instance

**To use the pipeline:**

1. Update the variables in `azure-pipelines.yml`:
   - `dockerRegistryServiceConnection`
   - `azureSubscription`
   - Resource group name
   - Registry details

2. Create pipeline variables in Azure DevOps:
   - `apiSecret` (secret)
   - `registryUsername`
   - `registryPassword` (secret)

3. Commit and push to trigger the pipeline

## License Information

This project uses only open-source dependencies with permissive licenses:

- **express** - MIT License
- **pdf-lib** - MIT License
- **multer** - MIT License
- **TypeScript** - Apache-2.0 License
- **Jest** - MIT License

All dependencies have been verified to use permissive licenses suitable for commercial use.

## Project Structure

```
pdf-lib-webservice/
├── src/
│   ├── middleware/
│   │   ├── auth.middleware.ts      # Authentication middleware
│   │   ├── error.middleware.ts     # Error handling
│   │   └── __tests__/              # Middleware tests
│   ├── routes/
│   │   ├── pdf.routes.ts           # PDF endpoints
│   │   └── __tests__/              # Route tests
│   ├── services/
│   │   └── pdf.service.ts          # PDF manipulation logic
│   ├── types/
│   │   └── pdf.types.ts            # TypeScript interfaces
│   ├── app.ts                      # Express app setup
│   └── index.ts                    # Server entry point
├── dist/                           # Compiled JavaScript (generated)
├── coverage/                       # Test coverage reports (generated)
├── .github/
│   └── copilot-instructions.md     # Project guidelines
├── Dockerfile                      # Docker configuration
├── docker-compose.yml              # Docker Compose setup
├── azure-pipelines.yml             # CI/CD pipeline
├── jest.config.js                  # Jest configuration
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Dependencies and scripts
└── README.md                       # This file
```

## Security Considerations

- Always use strong, randomly generated secrets for `API_SECRET`
- Never commit `.env` files or secrets to version control
- Run containers as non-root user (configured in Dockerfile)
- Keep dependencies updated regularly
- Use HTTPS in production (configure reverse proxy)
- Implement rate limiting if exposed to public internet
- Validate and sanitize all file uploads

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:
```bash
# Change port in .env file
PORT=8080

# Or set environment variable
PORT=8080 npm run dev
```

### Authentication Issues

If getting 401/403 errors:
- Verify `API_SECRET` is set in environment
- Check that `Authorization` header matches the secret exactly
- Ensure no extra spaces or quotes in the header

### Docker Build Fails

- Ensure Docker daemon is running
- Check that you have sufficient disk space
- Try cleaning Docker cache: `docker system prune`

## Contributing

1. Follow test-driven development practices
2. Ensure all tests pass before committing
3. Maintain code coverage above 70%
4. Use English for all code and documentation
5. Follow existing code style and conventions

## Support

For issues or questions:
1. Check existing issues in the repository
2. Review the troubleshooting section
3. Create a new issue with detailed information

## Future Enhancements

Potential features to add:
- PDF merging and splitting
- Image extraction from PDFs
- PDF encryption/decryption
- Text extraction and search
- PDF conversion to other formats
- Batch processing support
- Webhook notifications
- Rate limiting and quota management

---

**Note:** This service is designed to run behind a reverse proxy (nginx, Azure Application Gateway, etc.) that handles HTTPS/SSL termination.
