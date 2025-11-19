# Azure Deployment

Bicep infrastructure and deployment scripts for Azure Container Instances.

## Files

- `*.bicep` - Infrastructure as Code templates
- `deploy.ps1` - PowerShell deployment script
- `*.env` - Environment configurations (dev/staging/prod)

## Configuration

Edit `.env` file with your Azure configuration:
- `TENANT_ID`, `SUBSCRIPTION_ID`, `RESOURCE_GROUP`, `LOCATION`
- `CONTAINER_GROUP_NAME`, `STORAGE_ACCOUNT_NAME`
- `API_SECRET`, `API_BASE_URL`

## Deployment

```powershell
.\deploy.ps1 -Environment prod -ImageTag latest
```

Script creates resource group, deploys Bicep templates, and restarts container.

## Endpoints

- `GET /health`
- `POST /api/pdf/extract-fields`
- `POST /api/pdf/fill-form`

URL from `API_BASE_URL` in `.env` file.

## Infrastructure

- `main.bicep` - Main template, orchestrates resources
- `aci.bicep` - Azure Container Instance definition
- `storage-account.bicep` - Storage account for file shares
- `caddy.bicep` - Caddy reverse proxy container

## Logs

```bash
az container logs --name <container-group> --resource-group <rg> --follow
```