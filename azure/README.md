# Azure Container Instance (ACI) Deployment

Deploy the RESTful PDF Library service to Azure Container Instances with automatic HTTPS using Caddy as a reverse proxy.

## Architecture

This deployment creates an Azure Container Instance container group with two containers:

- **restful-pdf-lib**: The main PDF manipulation service running on port 3000
- **caddy**: A reverse proxy providing automatic HTTPS since ACI does not provide SSL natively

## Prerequisites

- Azure CLI installed and configured
- PowerShell (for Windows) or PowerShell Core (for macOS/Linux)
- An Azure subscription
- Docker image published to GitHub Container Registry: `ghcr.io/bstaeheli/restful-pdf-lib:latest`

## Deployment Instructions

### Multi-Environment Setup

This deployment supports multiple environments: **dev**, **staging**, and **prod**.

1. **Configure Environment Variables**

   Copy the appropriate template for your environment:

   ```bash
   # For development
   cp dev.env.template dev.env
   
   # For staging
   cp staging.env.template staging.env
   
   # For production
   cp prod.env.template prod.env
   ```

2. **Populate the environment file**

   Edit your environment file (e.g., `prod.env`) with your Azure configuration:

   ```env
   TENANT_ID=your-tenant-id
   SUBSCRIPTION_ID=your-subscription-id
   RESOURCE_GROUP=pdf-lib-prod-rg
   LOCATION=westeurope
   CONTAINER_GROUP_NAME=pdf-lib-prod
   STORAGE_ACCOUNT_NAME=pdfliststorageprod
   API_SECRET=your-secret-token
   API_BASE_URL=https://pdf-lib-prod.westeurope.azurecontainer.io
   ```

3. **Run the Deployment**

   Execute the PowerShell deployment script with the desired environment:

   ```powershell
   # Deploy to production (default)
   ./deploy.ps1 prod
   
   # Deploy to staging
   ./deploy.ps1 staging
   
   # Deploy to development
   ./deploy.ps1 dev
   ```

   This script will:
   - Load environment variables from `.env`
   - Login to Azure
   - Create the resource group
   - Deploy the Bicep template

4. **Access the Service**

   After deployment, the service will be available at:
   - HTTPS: `https://{CONTAINER_GROUP_NAME}.{LOCATION}.azurecontainer.io`
   - HTTP: `http://{CONTAINER_GROUP_NAME}.{LOCATION}.azurecontainer.io` (redirects to HTTPS)

   For example: `https://pdf-lib-aci.westeurope.azurecontainer.io`

## Parameters

| Parameter              | Description                                                      | Example              |
| ---------------------- | ---------------------------------------------------------------- | -------------------- |
| `containerGroupName`   | The name of the Azure Container Instance container group         | `pdf-lib-aci`        |
| `storageAccountName`   | The name of the storage account to be created (must be unique)   | `pdfliststorage`     |
| `location`             | Azure region where resources will be deployed                    | `westeurope`         |
| `apiSecret`            | Secret token for authenticating API requests                     | `your-secret-token`  |
| `apiBaseUrl`           | The public URL where the service will be accessible              | `https://pdf-lib-aci.westeurope.azurecontainer.io` |

## Bicep Files

| File                    | Description                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `main.bicep`            | The main Bicep file that orchestrates the deployment of the entire solution          |
| `storage-account.bicep` | Creates a storage account and file shares to persist data for the Caddy container    |
| `aci.bicep`             | Defines the Azure Container Instance container group with the PDF lib and Caddy containers |

## Resource Details

### Storage Account
- SKU: Standard_LRS
- Kind: StorageV2
- Access Tier: Hot
- TLS Version: 1.2 minimum
- Public blob access: Disabled
- Creates a file share for Caddy data persistence

### Container Group
- OS: Linux
- Restart Policy: Never
- Public IP with DNS name label
- Ports: 80 (HTTP), 443 (HTTPS)

### Containers

#### Caddy Container
- Image: `docker.io/caddy:latest`
- CPU: 1 core
- Memory: 1 GB
- Provides automatic HTTPS with Let's Encrypt
- Reverse proxies to the PDF library service on localhost:3000

#### PDF Library Container
- Image: `ghcr.io/bstaeheli/restful-pdf-lib:latest`
- CPU: 1 core
- Memory: 1 GB
- Environment variables:
  - `PORT`: 3000
  - `API_BASE_URL`: Public URL of the service
  - `API_SECRET`: Authentication token (secure)

## Cleanup

To remove all deployed resources:

```bash
az group delete --name {RESOURCE_GROUP} --yes --no-wait
```

## Troubleshooting

### View Container Logs

```bash
# View PDF library logs
az container logs --resource-group {RESOURCE_GROUP} --name {CONTAINER_GROUP_NAME} --container-name {CONTAINER_GROUP_NAME}-pdf-lib

# View Caddy logs
az container logs --resource-group {RESOURCE_GROUP} --name {CONTAINER_GROUP_NAME} --container-name {CONTAINER_GROUP_NAME}-caddy
```

### Check Container Status

```bash
az container show --resource-group {RESOURCE_GROUP} --name {CONTAINER_GROUP_NAME} --query instanceView.state
```

### Common Issues

1. **Storage account name already exists**: Storage account names must be globally unique. Choose a different name.
2. **Container fails to start**: Check the logs using the commands above.
3. **HTTPS certificate not working**: Caddy needs a few minutes to obtain the Let's Encrypt certificate on first run.

## Security Considerations

- API secret is passed as a secure parameter and stored as an environment variable
- Storage account has blob public access disabled
- HTTPS is enforced via Caddy
- Minimum TLS 1.2 is required for the storage account
- Network ACLs allow Azure services by default

## Cost Estimation

The deployment uses:
- 1 Container Group (2 containers)
- Each container: 1 CPU core, 1 GB RAM
- 1 Storage account with minimal file share (1 GB)

Estimated monthly cost (approximate):
- Container Instances: ~€30-40/month (depending on region and uptime)
- Storage: ~€0.50/month

Costs will vary based on region, actual resource usage, and uptime.
