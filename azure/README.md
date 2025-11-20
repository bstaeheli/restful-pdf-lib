# Azure Functions Deployment

Bicep infrastructure for Azure Functions (Flex Consumption).

## Files

- `function-app.bicep` - Infrastructure as Code template
- `deploy-functions.ps1` - PowerShell deployment script
- `*.env` - Environment configurations (dev/staging/prod)

## Configuration

Edit `.env` file:
- `TENANT_ID`, `SUBSCRIPTION_ID`, `RESOURCE_GROUP`, `LOCATION`
- `FUNCTION_APP_NAME`, `STORAGE_ACCOUNT_NAME`
- `API_SECRET`

## Deployment

```powershell
.\deploy-functions.ps1 staging
# or
.\deploy-functions.ps1 production
```

## Endpoints

After deployment, available at `https://{function-app-name}.azurewebsites.net/api/`

- `GET /health`
- `POST /pdf/extract-fields`
- `POST /pdf/fill-form`

## Logs

```bash
az functionapp logs --name <function-app> --resource-group <rg>
```