# Docker Deployment

This guide covers building and running the PDF Library Web Service using Docker.

## Using Pre-built Images

The easiest way to run the service is using pre-built images from GitHub Container Registry:

```bash
# Pull latest image
docker pull ghcr.io/<your-username>/restful-pdf-lib:latest

# Run container
docker run -p 3000:3000 \
  -e API_SECRET=your-secret-token \
  -e NODE_ENV=production \
  ghcr.io/<your-username>/restful-pdf-lib:latest
```

## Building Locally

### Build the Image

Using npm scripts:

```bash
npm run docker:build
```

Or manually:

```bash
docker build -t restful-pdf-lib .
```

### Run the Container

Using npm scripts:

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

## Docker Compose

For easier management, use Docker Compose:

```bash
# Set environment variable
export API_SECRET=your-secret-token

# Start service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop service
docker-compose down
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `API_SECRET` | Yes | - | Authentication secret |
| `PORT` | No | 3000 | Service port |
| `NODE_ENV` | No | production | Environment mode |

### Volume Mounts

For persistent data or custom configurations:

```bash
docker run -p 3000:3000 \
  -e API_SECRET=your-secret \
  -v /path/to/uploads:/app/uploads \
  restful-pdf-lib
```

## Multi-Platform Builds

Build for multiple architectures:

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t restful-pdf-lib:latest \
  --push .
```

## Health Checks

The Docker image includes built-in health checks:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' <container-id>
```

Health endpoint: `http://localhost:3000/health`

## Security Features

The Dockerfile implements security best practices:

- ✅ **Multi-stage build** - Smaller final image
- ✅ **Non-root user** - Runs as user `node`
- ✅ **Minimal base image** - Uses Alpine Linux
- ✅ **Health checks** - Automatic container monitoring
- ✅ **No dev dependencies** - Production-only packages

## Debugging

### View Logs

```bash
docker logs -f <container-id>
```

### Execute Commands in Container

```bash
docker exec -it <container-id> /bin/sh
```

### Inspect Container

```bash
docker inspect <container-id>
```

## Performance Tuning

### Resource Limits

```bash
docker run -p 3000:3000 \
  -e API_SECRET=your-secret \
  --memory="512m" \
  --cpus="0.5" \
  restful-pdf-lib
```

### Optimize Build Cache

Use `.dockerignore` to exclude unnecessary files:

```
node_modules
dist
coverage
*.log
.env
```

## Troubleshooting

### Port Already in Use

```bash
# Use different port
docker run -p 8080:3000 -e API_SECRET=your-secret restful-pdf-lib
```

### Container Exits Immediately

Check logs:
```bash
docker logs <container-id>
```

Ensure `API_SECRET` is set.

### Build Fails

- Check Docker daemon is running
- Ensure sufficient disk space
- Clear build cache: `docker builder prune`
