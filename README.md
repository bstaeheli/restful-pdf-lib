# RESTful PDF Library

![Docker Build](https://github.com/bstaeheli/restful-pdf-lib/actions/workflows/docker-publish.yml/badge.svg)

REST API for PDF manipulation using [pdf-lib](https://pdf-lib.js.org).

**Features:**
- Extract form fields from PDFs with position data
- Fill PDF forms with data
- Secure authentication with API secret
- Docker deployment via GitHub Container Registry
- Azure Container Instances deployment with Bicep

## Quick Start

```bash
npm install
cp .env.example .env  # Set API_SECRET
npm run dev
```

API Docs: `http://localhost:3000/api-docs`

## API Endpoints

- `POST /api/pdf/extract-fields` - Extract form fields with position data (cm)
- `POST /api/pdf/fill-form` - Fill PDF form fields
- `GET /health` - Health check (no auth)

Authentication: `Authorization` header with API secret.

See Swagger UI at `/api-docs` for interactive documentation.

## Deployment

### Docker (GitHub Container Registry)

```bash
docker run -p 3000:3000 -e API_SECRET=your-secret ghcr.io/bstaeheli/restful-pdf-lib:latest
```

**Available tags:** [View on GHCR](https://github.com/bstaeheli/restful-pdf-lib/pkgs/container/restful-pdf-lib)
- `latest` - Latest build from main branch
- `main` - Same as latest
- `build-XXX` - Specific build number from CI/CD
- `sha-XXX` - Specific git commit

### Azure Container Instances

```powershell
cd azure
cp prod.env.template prod.env  # Configure environment
.\deploy.ps1 -Environment prod -ImageTag latest
```

See [azure/README.md](./azure/README.md) for Bicep infrastructure details.

## Development

```bash
npm run dev              # Start with hot reload
npm test                 # Run tests
npm run test:coverage    # Coverage report
npm run build            # Build TypeScript
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_SECRET` | Yes | - | Authentication token |
| `PORT` | No | 3000 | Server port |
| `NODE_ENV` | No | production | Environment mode |

## Tech Stack

Node.js 22, TypeScript, Express, pdf-lib, Jest, Docker, Bicep (Azure IaC)

## License

MIT

