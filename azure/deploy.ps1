# Parse command line arguments
param(
    [Parameter(Position=0)]
    [string]$Environment,
    
    [Parameter(Position=1)]
    [string]$ImageTag = "latest"
)

# Determine environment file path
if ($Environment) {
    # Validate environment parameter if provided
    if ($Environment -notin @('dev', 'staging', 'prod', 'production')) {
        Write-Host "Error: Invalid environment: $Environment" -ForegroundColor Red
        Write-Host "Valid options: dev, staging, prod" -ForegroundColor Yellow
        exit 1
    }
    # Map production to prod
    $envName = if ($Environment -eq 'production') { 'prod' } else { $Environment }
    $envFilePath = "$envName.env"
} else {
    # No environment specified - use .env as fallback
    $envFilePath = ".env"
}

# Load environment file and set environment variables
if (-not (Test-Path $envFilePath)) {
    Write-Host "Error: Environment file not found: $envFilePath" -ForegroundColor Red
    if ($Environment) {
        Write-Host "Create the file by copying the template: cp $envName.env.template $envFilePath" -ForegroundColor Yellow
    } else {
        Write-Host "Usage: .\deploy.ps1 [dev|staging|prod]" -ForegroundColor Yellow
        Write-Host "Or create a .env file with your configuration" -ForegroundColor Yellow
    }
    exit 1
}

Write-Host "Loading environment from: $envFilePath" -ForegroundColor Green
Get-Content $envFilePath | ForEach-Object {
    if ($_ -match "^\s*([^#][^=]+)=(.*)\s*$") {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($name, $value)
        # Don't display sensitive values
        if ($name -eq "API_SECRET") {
            Write-Host "  $name=***" -ForegroundColor Gray
        } else {
            Write-Host "  $name=$value" -ForegroundColor Gray
        }
    }
}

$tenantId = [System.Environment]::GetEnvironmentVariable("TENANT_ID")
$subscriptionId = [System.Environment]::GetEnvironmentVariable("SUBSCRIPTION_ID")
$resourceGroup = [System.Environment]::GetEnvironmentVariable("RESOURCE_GROUP")
$location = [System.Environment]::GetEnvironmentVariable("LOCATION")
$containerGroupName = [System.Environment]::GetEnvironmentVariable("CONTAINER_GROUP_NAME")
$storageAccountName = [System.Environment]::GetEnvironmentVariable("STORAGE_ACCOUNT_NAME")
$apiSecret = [System.Environment]::GetEnvironmentVariable("API_SECRET")
$apiBaseUrl = [System.Environment]::GetEnvironmentVariable("API_BASE_URL")

Write-Host "`nStarting Azure deployment..." -ForegroundColor Cyan

az config set core.login_experience_v2=off 2>$null
Write-Host "Logging in to Azure..." -ForegroundColor Cyan
az login --tenant $tenantId --output none

Write-Host "Setting subscription..." -ForegroundColor Cyan
az account set --subscription $subscriptionId

# Fetch available image tags from GitHub Container Registry
Write-Host "`nFetching available Docker image tags from GHCR..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "https://ghcr.io/v2/bstaeheli/restful-pdf-lib/tags/list" -ErrorAction SilentlyContinue
    if ($response.tags) {
        $tags = $response.tags | Sort-Object -Descending | Select-Object -First 10
        Write-Host "Available tags (latest 10):" -ForegroundColor Gray
        foreach ($tag in $tags) {
            if ($tag -eq $ImageTag) {
                Write-Host "  • $tag" -ForegroundColor Green -NoNewline
                Write-Host " ← selected" -ForegroundColor Yellow
            } else {
                Write-Host "  • $tag" -ForegroundColor Gray
            }
        }
    }
} catch {
    Write-Host "Could not fetch tags (container may be private or network issue)" -ForegroundColor Yellow
}

Write-Host "`nCreating resource group..." -ForegroundColor Cyan
az group create --name $resourceGroup --location $location --output none

Write-Host "Deploying infrastructure (this may take a few minutes)..." -ForegroundColor Cyan
Write-Host "Using Docker image tag: $ImageTag" -ForegroundColor Gray
$deploymentResult = az deployment group create `
    --name pdf-lib-deployment `
    --resource-group $resourceGroup `
    --template-file main.bicep `
    --parameters containerGroupName=$containerGroupName `
    storageAccountName=$storageAccountName `
    location=$location `
    apiSecret=$apiSecret `
    apiBaseUrl=$apiBaseUrl `
    imageTag=$ImageTag `
    --output json 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nDeployment failed!" -ForegroundColor Red
    Write-Host $deploymentResult
    exit 1
}

# Force container restart to pull latest image
Write-Host "`nRestarting container to pull latest image..." -ForegroundColor Cyan
az container restart --name $containerGroupName --resource-group $resourceGroup --output none 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Container restarted successfully" -ForegroundColor Green
} else {
    Write-Host "Note: Container restart failed (may be first deployment)" -ForegroundColor Yellow
}

# Display summary
Write-Host "`n╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              Deployment Successful! 🎉                           ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`nEnvironment: " -NoNewline
Write-Host $($Environment ? $Environment : "default") -ForegroundColor Yellow

Write-Host "Resource Group: " -NoNewline
Write-Host $resourceGroup -ForegroundColor Yellow

Write-Host "Location: " -NoNewline
Write-Host $location -ForegroundColor Yellow

Write-Host "`n📍 Service Endpoints:" -ForegroundColor Cyan
$baseUrl = "$apiBaseUrl"
Write-Host "   API Base:      " -NoNewline
Write-Host $baseUrl -ForegroundColor White

Write-Host "   API Docs:      " -NoNewline
Write-Host "$baseUrl/api-docs" -ForegroundColor White

Write-Host "   Health Check:  " -NoNewline
Write-Host "$baseUrl/health" -ForegroundColor White

Write-Host "`n💡 Note: HTTPS certificate will be automatically provisioned by Caddy (may take 1-2 minutes)" -ForegroundColor Gray

Write-Host "`nTest your deployment:" -ForegroundColor Cyan
Write-Host "  curl $baseUrl/health" -ForegroundColor Gray
