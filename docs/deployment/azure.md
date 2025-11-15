# Azure Deployment Guide

This guide covers deploying the PDF Library Web Service to Azure Container Instances.

## Prerequisites

- Azure CLI installed and configured
- Docker image available (from GHCR or ACR)
- Active Azure subscription

## Deployment Options

### Option 1: Deploy from GitHub Container Registry (Recommended)

GitHub Actions automatically builds and publishes Docker images to GHCR. This is the simplest approach.

```bash
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

If you prefer using Azure Container Registry:

1. **Create Azure Container Registry:**

```bash
az acr create \
  --resource-group myResourceGroup \
  --name myregistry \
  --sku Basic
```

2. **Build and push image:**

```bash
az acr login --name myregistry

docker build -t myregistry.azurecr.io/restful-pdf-lib:latest .
docker push myregistry.azurecr.io/restful-pdf-lib:latest
```

3. **Deploy to Azure Container Instance:**

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

## Access Your Service

After successful deployment:

```
http://pdf-lib-service.<region>.azurecontainer.io:3000
```

Swagger documentation available at:

```
http://pdf-lib-service.<region>.azurecontainer.io:3000/api-docs
```

## Security Recommendations

- ⚠️ **Use HTTPS in production** - Configure Azure Application Gateway or reverse proxy
- 🔒 **Store secrets in Azure Key Vault** - Don't use `--secure-environment-variables` directly
- 🛡️ **Restrict network access** - Use Azure Virtual Networks and NSGs
- 📊 **Enable monitoring** - Configure Azure Monitor and Log Analytics

## Azure DevOps Pipeline

The project includes `azure-pipelines.yml` for automated deployment via Azure DevOps.

### Setup Steps:

1. **Update pipeline variables:**
   - `dockerRegistryServiceConnection`
   - `azureSubscription`
   - Resource group name
   - Registry name

2. **Configure secrets in Azure DevOps:**
   - `apiSecret` (mark as secret)
   - `registryUsername`
   - `registryPassword` (mark as secret)

3. **Create service connections:**
   - Docker Registry connection
   - Azure subscription connection

4. **Push to trigger deployment**

## Monitoring & Logs

View container logs:

```bash
az container logs \
  --resource-group myResourceGroup \
  --name restful-pdf-lib \
  --follow
```

Check container status:

```bash
az container show \
  --resource-group myResourceGroup \
  --name restful-pdf-lib \
  --query "{Status:instanceView.state, IP:ipAddress.ip, FQDN:ipAddress.fqdn}"
```

## Scaling & Updates

Restart container:

```bash
az container restart \
  --resource-group myResourceGroup \
  --name restful-pdf-lib
```

Update to new image version:

```bash
az container delete \
  --resource-group myResourceGroup \
  --name restful-pdf-lib \
  --yes

# Then redeploy with new image tag
```

## Cost Optimization

- Use Basic SKU for ACR
- Scale down CPU/memory if traffic is low
- Use Azure Container Apps for auto-scaling needs
- Configure retention policies for container logs
