# Deployment Checklist

Use this checklist to ensure a successful deployment.

## 🔧 Local Development Setup

- [ ] Clone repository and install dependencies: `npm install`
- [ ] Create `.env` file from `.env.example`
- [ ] Set strong `API_SECRET` in `.env`
  ```bash
  openssl rand -base64 32
  ```
- [ ] Run tests: `npm test`
- [ ] Build project: `npm run build`
- [ ] Test locally: `npm run dev`

## 🔒 Security

- [ ] Use strong, randomly generated `API_SECRET` (min 32 characters)
- [ ] Never commit `.env` or secrets to version control
- [ ] Use secure secret management (Azure Key Vault, GitHub Secrets)
- [ ] Configure HTTPS in production (reverse proxy/load balancer)
- [ ] Review and restrict CORS if needed
- [ ] Consider implementing rate limiting
- [ ] Keep dependencies updated: `npm audit`

## 🐳 Docker

- [ ] Build image successfully: `npm run docker:build`
- [ ] Test container locally: `docker run -p 3000:3000 -e API_SECRET=test restful-pdf-lib`
- [ ] Verify health endpoint: `curl http://localhost:3000/health`
- [ ] Test with sample PDF

## ☁️ GitHub Actions

- [ ] Push code to GitHub repository
- [ ] Verify workflow runs successfully
- [ ] Check image published to GHCR
- [ ] Configure package visibility (public/private)
- [ ] Test pulling image: `docker pull ghcr.io/<username>/restful-pdf-lib:latest`

## ☁️ Azure Deployment

### Preparation
- [ ] Azure CLI installed and configured
- [ ] Active Azure subscription
- [ ] Resource group created

### Container Instance
- [ ] Deploy using GHCR or ACR image
- [ ] Configure environment variables
- [ ] Set secure API secret
- [ ] Configure DNS label
- [ ] Test deployment endpoint
- [ ] Verify Swagger UI accessible

### Monitoring
- [ ] Configure Azure Monitor
- [ ] Set up log analytics
- [ ] Create health check alerts
- [ ] Test log collection

## 🧪 Testing

Before deployment:
- [ ] All tests pass: `npm test`
- [ ] Code coverage acceptable: `npm run test:coverage`
- [ ] Linting passes: `npm run lint`
- [ ] Manual API testing completed

## 📊 Post-Deployment

- [ ] Health endpoint returns 200: `curl https://your-domain/health`
- [ ] Swagger UI accessible: `https://your-domain/api-docs`
- [ ] Test PDF extraction with sample file
- [ ] Test PDF form filling with sample data
- [ ] Verify authentication works correctly
- [ ] Check error handling returns proper status codes
- [ ] Monitor logs for errors
- [ ] Document production URL and endpoints

## 🔄 Maintenance

- [ ] Schedule regular dependency updates
- [ ] Monitor security advisories: `npm audit`
- [ ] Review application logs regularly
- [ ] Test disaster recovery procedures
- [ ] Document incident response process
- [ ] Keep deployment documentation updated

## 📝 Documentation

- [ ] Update README.md with production URLs
- [ ] Document API endpoints for team
- [ ] Create runbook for common operations
- [ ] Document troubleshooting steps
- [ ] Keep architecture diagrams current
