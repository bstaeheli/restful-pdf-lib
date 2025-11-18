# Azure Functions Deployment

This directory contains the infrastructure and deployment scripts for deploying the PDF Library service to Azure Functions.

## Files Overview

- `function-app.bicep` - Bicep template for Azure Functions infrastructure
- `deploy-functions.ps1` - PowerShell deployment script for Azure Functions
- `*.env.template` - Environment configuration templates

## Prerequisites

1. Azure CLI installed and logged in
2. Azure Functions Core Tools v4
3. Node.js 18+ and npm
4. PowerShell 7+ (recommended)
5. Appropriate Azure subscription permissions

## Configuration

1. Copy the environment template for your target environment:
   ```powershell
   cp staging.env.template staging.env
   # or
   cp prod.env.template prod.env
   ```

2. Edit the `.env` file with your specific values:
   - `TENANT_ID` - Your Azure AD tenant ID
   - `SUBSCRIPTION_ID` - Your Azure subscription ID
   - `RESOURCE_GROUP` - Name for the resource group
   - `LOCATION` - Azure region (e.g., "West Europe")
   - `FUNCTION_APP_NAME` - Name for the Function App (must be globally unique)
   - `STORAGE_ACCOUNT_NAME` - Name for the storage account (must be globally unique)
   - `API_SECRET` - Secret token for API authentication

## Deployment Options

### Option 1: Azure Functions (Serverless)

Deploy to Azure Functions for serverless execution:

```powershell
# Deploy to staging
./deploy-functions.ps1 staging

# Deploy to production
./deploy-functions.ps1 production
```

The deployment script will:
1. Log into Azure using the specified tenant
2. Create the resource group if it doesn't exist
3. Deploy the Function App infrastructure
4. Build and deploy the function code
5. Run health checks

### Option 2: Docker Container

The project also supports Docker deployment via GitHub Container Registry:

1. **Local Development:**
   ```bash
   npm run docker:build
   npm run docker:run
   ```

2. **Production via GitHub Container Registry:**
   - Push to main branch triggers automatic build and push to `ghcr.io/bstaeheli/restful-pdf-lib`
   - Use the published image in your preferred container platform

## Service Endpoints

### Azure Functions
After deployment, the service will be available at:
- Health check: `https://{function-app-name}.azurewebsites.net/api/health`
- Extract fields: `POST https://{function-app-name}.azurewebsites.net/api/pdf/extract-fields`
- Fill form: `POST https://{function-app-name}.azurewebsites.net/api/pdf/fill-form`

### Docker Container
When running in Docker:
- Health check: `http://localhost:3000/health`
- API documentation: `http://localhost:3000/api-docs`
- Extract fields: `POST http://localhost:3000/api/pdf/extract-fields`
- Fill form: `POST http://localhost:3000/api/pdf/fill-form`

## Development

### Local Azure Functions Development

1. Install Azure Functions Core Tools:
   ```bash
   npm install -g azure-functions-core-tools@4
   ```

2. Start local Functions runtime:
   ```bash
   npm run func:dev
   ```

3. Functions will be available at:
   - `http://localhost:7071/api/health`
   - `http://localhost:7071/api/pdf/extract-fields`
   - `http://localhost:7071/api/pdf/fill-form`

### Local Express Development

1. Start the Express server:
   ```bash
   npm run dev
   ```

2. API will be available at:
   - `http://localhost:3000/health`
   - `http://localhost:3000/api-docs`
   - `http://localhost:3000/api/pdf/extract-fields`
   - `http://localhost:3000/api/pdf/fill-form`

## Monitoring

The Azure Functions deployment includes:
- Application Insights for monitoring and logging
- Azure Storage for Function App state
- Health check endpoint for monitoring
- CORS configuration for web access

## GitHub Actions

The project includes two GitHub Actions workflows:

1. **Docker Build & Push** (`.github/workflows/docker-publish.yml`)
   - Builds and pushes Docker images to GitHub Container Registry
   - Runs on push to main/develop branches and tags

## Troubleshooting

### Common Issues

1. **Function App name already exists**
   - Function App names must be globally unique
   - Try a different name in your environment file

2. **Storage account name already exists**
   - Storage account names must be globally unique
   - Use a random suffix in the storage account name

3. **Insufficient permissions**
   - Ensure your account has Contributor access to the subscription

4. **Function deployment failures**
   - Check build logs with `npm run build`
   - Verify all dependencies are properly installed
   - Check Function App logs in Azure Portal

### Checking Logs

**Azure Functions:**
1. Navigate to your Function App in Azure Portal
2. Go to "Functions" > select your function > "Monitor"
3. Or use Application Insights for detailed monitoring

**Docker Container:**
```bash
docker logs restful-pdf-lib
```