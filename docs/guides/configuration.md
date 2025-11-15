# Configuration Guide

Complete guide for configuring the PDF Library Web Service.

## Environment Variables

### Required Variables

**`API_SECRET`**
- **Description:** Secret token for API authentication
- **Required:** Yes
- **Example:** `your-secure-secret-token-here`
- **Generation:**
  ```bash
  openssl rand -base64 32
  ```

### Optional Variables

**`PORT`**
- **Description:** Port number for the service
- **Required:** No
- **Default:** `3000`
- **Example:** `8080`

**`NODE_ENV`**
- **Description:** Environment mode
- **Required:** No
- **Default:** `production`
- **Options:** `development`, `production`, `test`

## Configuration Files

### `.env` File

Create from `.env.example`:

```bash
cp .env.example .env
```

Example configuration:

```env
# Required
API_SECRET=your-secure-secret-token-here

# Optional
PORT=3000
NODE_ENV=development
```

**Security:**
- Never commit `.env` to version control
- Use different secrets for each environment
- Generate strong random secrets (min 32 characters)
- Rotate secrets regularly

### TypeScript Configuration

File: `tsconfig.json`

Key settings:
- `strict: true` - Enable all strict type checking
- `target: "ES2020"` - Target modern JavaScript
- `module: "commonjs"` - CommonJS modules for Node.js
- `outDir: "./dist"` - Compiled output directory

### Jest Configuration

File: `jest.config.js`

Test settings:
- Uses `ts-jest` for TypeScript support
- Coverage directory: `./coverage`
- Test match: `**/__tests__/**/*.test.ts`

### ESLint Configuration

File: `.eslintrc.json`

Code quality rules:
- TypeScript ESLint recommended rules
- Strict type checking
- English-only code and comments

## Docker Configuration

### Environment Variables in Docker

**Docker Run:**
```bash
docker run -p 3000:3000 \
  -e API_SECRET=your-secret \
  -e PORT=3000 \
  -e NODE_ENV=production \
  restful-pdf-lib
```

**Docker Compose:**
```yaml
environment:
  - API_SECRET=${API_SECRET}
  - PORT=3000
  - NODE_ENV=production
```

### Volume Mounts

For custom uploads directory:
```bash
docker run -p 3000:3000 \
  -e API_SECRET=your-secret \
  -v /host/uploads:/app/uploads \
  restful-pdf-lib
```

### Health Check

Configured in `Dockerfile`:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"
```

## Azure Configuration

### Container Instance

Environment variables:
```bash
--environment-variables NODE_ENV=production PORT=3000 \
--secure-environment-variables API_SECRET=your-secret
```

### Key Vault Integration

For production, use Azure Key Vault:

```bash
# Store secret in Key Vault
az keyvault secret set \
  --vault-name myKeyVault \
  --name ApiSecret \
  --value "your-secret"

# Reference in Container Instance
az container create \
  --name restful-pdf-lib \
  --environment-variables \
    API_SECRET_KEYVAULT="@Microsoft.KeyVault(SecretUri=https://mykeyvault.vault.azure.net/secrets/ApiSecret)"
```

## Production Recommendations

### Security

1. **Use strong secrets:**
   ```bash
   # Generate 256-bit secret
   openssl rand -base64 32
   ```

2. **Use secret management:**
   - Azure Key Vault
   - AWS Secrets Manager
   - HashiCorp Vault
   - Kubernetes Secrets

3. **Enable HTTPS:**
   - Use reverse proxy (nginx, Caddy)
   - Configure Azure Application Gateway
   - Use Let's Encrypt for certificates

### Performance

1. **Resource limits:**
   ```bash
   docker run --memory="1g" --cpus="1.0" restful-pdf-lib
   ```

2. **Node.js options:**
   ```env
   NODE_OPTIONS=--max-old-space-size=1024
   ```

### Monitoring

1. **Health checks:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Logging:**
   - Set `NODE_ENV=production` for optimized logging
   - Use Azure Monitor or similar for log aggregation

3. **Metrics:**
   - Monitor CPU and memory usage
   - Track API response times
   - Monitor error rates

## Development vs Production

### Development

```env
NODE_ENV=development
PORT=3000
API_SECRET=dev-secret-not-for-production
```

Features:
- Hot reload with `npm run dev`
- Detailed error messages
- Source maps enabled

### Production

```env
NODE_ENV=production
PORT=3000
API_SECRET=strong-randomly-generated-secret
```

Features:
- Optimized builds
- Minimal error details
- Performance optimizations
- Health checks enabled

## Troubleshooting

### Port Conflicts

Change port in `.env`:
```env
PORT=8080
```

### Authentication Issues

Verify secret configuration:
```bash
# Check environment
echo $API_SECRET

# Test with curl
curl -H "Authorization: $API_SECRET" http://localhost:3000/health
```

### Docker Configuration

View container environment:
```bash
docker inspect <container-id> | grep -A 10 Env
```

## Next Steps

- Review [Security Best Practices](../deployment/checklist.md)
- See [Docker Deployment](../deployment/docker.md)
- Check [Azure Deployment](../deployment/azure.md)
