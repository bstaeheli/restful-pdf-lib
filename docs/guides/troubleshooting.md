# Troubleshooting Guide

Solutions for common issues.

## Installation Issues

### npm install fails

**Problem:** Dependencies fail to install

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try with legacy peer deps
npm install --legacy-peer-deps
```

### TypeScript compilation errors

**Problem:** `npm run build` fails

**Solutions:**
```bash
# Clean dist folder
rm -rf dist

# Rebuild
npm run build

# Check TypeScript version
npx tsc --version
```

## Runtime Issues

### Port already in use

**Problem:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=8080 npm run dev
```

### API_SECRET not set

**Problem:** Service won't start

**Solution:**
```bash
# Create .env file
cp .env.example .env

# Edit and add secret
echo "API_SECRET=$(openssl rand -base64 32)" >> .env
```

## Authentication Issues

### 401 Unauthorized

**Problem:** All API calls return 401

**Checklist:**
1. Verify `API_SECRET` is set in `.env`
2. Check `Authorization` header matches exactly
3. Ensure no extra spaces or quotes
4. Restart service after changing `.env`

**Test:**
```bash
# Set secret in environment
export API_SECRET="your-secret"

# Test endpoint
curl -H "Authorization: $API_SECRET" http://localhost:3000/api/pdf/extract-fields
```

### 403 Forbidden

**Problem:** Authentication works for some endpoints but not others

**Solution:** Verify all protected routes use auth middleware in `pdf.routes.ts`

## PDF Processing Issues

### "No PDF file uploaded" error

**Problem:** PDF upload fails

**Checklist:**
1. Verify `Content-Type: multipart/form-data` header
2. Ensure field name is `pdf`
3. Check file is valid PDF format
4. Verify file size under 10MB limit

**Example:**
```bash
curl -X POST http://localhost:3000/api/pdf/extract-fields \
  -H "Authorization: your-secret" \
  -F "pdf=@/path/to/file.pdf"
```

### "Failed to extract fields" error

**Problem:** PDF processing fails

**Possible causes:**
1. PDF is encrypted/password protected
2. PDF is corrupted
3. PDF has no form fields
4. Unsupported PDF format

**Solutions:**
- Remove password protection
- Verify PDF opens correctly
- Use Adobe Acrobat to check form fields
- Try different PDF file

### Field values not filling correctly

**Problem:** Fields remain empty after filling

**Checklist:**
1. Verify field names match exactly (case-sensitive)
2. Use correct data types:
   - Text fields: `"string"`
   - Checkboxes: `true` or `false`
   - Numbers: `"25"` (as string)
3. Check field name with extract endpoint first

**Example:**
```bash
# First extract to see field names
curl -X POST http://localhost:3000/api/pdf/extract-fields \
  -H "Authorization: your-secret" \
  -F "pdf=@form.pdf"

# Then fill using exact field names
curl -X POST http://localhost:3000/api/pdf/fill-form \
  -H "Authorization: your-secret" \
  -F "pdf=@form.pdf" \
  -F 'fields={"exactFieldName":"value"}' \
  --output filled.pdf
```

## Docker Issues

### Docker build fails

**Problem:** `docker build` command fails

**Solutions:**
```bash
# Check Docker daemon is running
docker info

# Clean build cache
docker builder prune

# Build with no cache
docker build --no-cache -t restful-pdf-lib .

# Check disk space
df -h
```

### Container exits immediately

**Problem:** Container starts then stops

**Solutions:**
```bash
# View logs
docker logs <container-id>

# Common causes:
# 1. Missing API_SECRET
docker run -e API_SECRET=your-secret restful-pdf-lib

# 2. Port conflict
docker run -p 8080:3000 -e API_SECRET=your-secret restful-pdf-lib

# 3. Check health
docker inspect --format='{{.State.Health.Status}}' <container-id>
```

### Cannot pull from GHCR

**Problem:** `docker pull` fails for private packages

**Solution:**
```bash
# Create GitHub personal access token with read:packages scope
# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u <username> --password-stdin

# Pull image
docker pull ghcr.io/<username>/restful-pdf-lib:latest
```

## Testing Issues

### Tests fail

**Problem:** `npm test` fails

**Solutions:**
```bash
# Run tests in verbose mode
npm test -- --verbose

# Run specific test file
npm test -- auth.middleware.test.ts

# Clear Jest cache
npm test -- --clearCache

# Update snapshots if needed
npm test -- -u
```

### Coverage not generated

**Problem:** No coverage report

**Solution:**
```bash
# Run with coverage flag
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

## Deployment Issues

### GitHub Actions workflow fails

**Problem:** CI/CD pipeline fails

**Checklist:**
1. Check Actions tab for detailed logs
2. Verify all tests pass locally: `npm test`
3. Ensure Docker builds locally: `docker build .`
4. Check workflow file syntax: `.github/workflows/docker-publish.yml`

### Azure deployment fails

**Problem:** Container Instance won't start

**Solutions:**
```bash
# Check container logs
az container logs \
  --resource-group myResourceGroup \
  --name restful-pdf-lib

# Verify image exists
az acr repository show \
  --name myregistry \
  --image restful-pdf-lib:latest

# Check container status
az container show \
  --resource-group myResourceGroup \
  --name restful-pdf-lib \
  --query instanceView.state
```

### Service unreachable after deployment

**Problem:** Cannot access deployed service

**Checklist:**
1. Verify container is running:
   ```bash
   az container show --name restful-pdf-lib --query instanceView.state
   ```

2. Check DNS/IP:
   ```bash
   az container show --name restful-pdf-lib --query ipAddress
   ```

3. Test health endpoint:
   ```bash
   curl http://<container-ip>:3000/health
   ```

4. Check firewall/network security groups

## Performance Issues

### Slow PDF processing

**Problem:** Large PDFs take too long

**Solutions:**
1. Increase container memory: `--memory 2`
2. Optimize PDF file size before upload
3. Consider implementing queue system
4. Add timeout limits

### High memory usage

**Problem:** Service uses too much RAM

**Solutions:**
```bash
# Limit Node.js memory
NODE_OPTIONS=--max-old-space-size=512 npm start

# Limit Docker container
docker run --memory="512m" restful-pdf-lib

# Monitor usage
docker stats <container-id>
```

## Logging & Debugging

### Enable debug logging

```bash
# Development mode
NODE_ENV=development npm run dev

# View Docker logs
docker logs -f <container-id>

# View Azure logs
az container logs --name restful-pdf-lib --follow
```

### Debug with VS Code

Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug",
  "program": "${workspaceFolder}/src/index.ts",
  "preLaunchTask": "npm: build",
  "outFiles": ["${workspaceFolder}/dist/**/*.js"]
}
```

## Getting Help

If issues persist:

1. Check [GitHub Issues](https://github.com/<username>/restful-pdf-lib/issues)
2. Review application logs
3. Test with minimal example
4. Create detailed bug report with:
   - Environment details
   - Error messages
   - Steps to reproduce
   - Expected vs actual behavior

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `EADDRINUSE` | Port in use | Change port or kill process |
| `Unauthorized` | Wrong/missing API secret | Check Authorization header |
| `No PDF file uploaded` | Wrong field name | Use `pdf` as field name |
| `Failed to extract fields` | Invalid PDF | Check PDF format/encryption |
| `Cannot find module` | Missing dependency | Run `npm install` |
| `ENOENT .env` | Missing .env file | Create from .env.example |
