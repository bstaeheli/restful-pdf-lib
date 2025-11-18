param(
    [Parameter(Position=0)]
    [string]$Environment = "staging"
)

# Validate environment
if ($Environment -notin @('staging', 'production')) {
    Write-Host "Error: Invalid environment: $Environment" -ForegroundColor Red
    Write-Host "Valid options: staging, production" -ForegroundColor Yellow
    exit 1
}

$envFilePath = "$Environment.env"

# Load environment variables
if (-not (Test-Path $envFilePath)) {
    Write-Host "Error: Environment file not found: $envFilePath" -ForegroundColor Red
    Write-Host "Create the file by copying: cp $Environment.env.template $envFilePath" -ForegroundColor Yellow
    exit 1
}

Write-Host "Loading environment from: $envFilePath" -ForegroundColor Green
Get-Content $envFilePath | ForEach-Object {
    if ($_ -match "^\s*([^#][^=]+)=(.*)\s*$") {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($name, $value)
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
$functionAppName = [System.Environment]::GetEnvironmentVariable("FUNCTION_APP_NAME")
$storageAccountName = [System.Environment]::GetEnvironmentVariable("STORAGE_ACCOUNT_NAME")
$apiSecret = [System.Environment]::GetEnvironmentVariable("API_SECRET")

$repoRoot = (Resolve-Path "..\").Path

Write-Host "`nStarting Azure Functions deployment..." -ForegroundColor Cyan
Write-Host "Repository root: $repoRoot" -ForegroundColor Gray

# Azure login
Write-Host "Logging into Azure..." -ForegroundColor Cyan
az login --tenant $tenantId --output none
az account set --subscription $subscriptionId

# Create resource group
Write-Host "Creating resource group..." -ForegroundColor Cyan
az group create --name $resourceGroup --location $location --output none

# Deploy infrastructure
Write-Host "Deploying Function App infrastructure..." -ForegroundColor Cyan
$deploymentResult = az deployment group create `
    --name "pdf-functions-$Environment-$(Get-Date -Format 'yyyyMMdd-HHmmss')" `
    --resource-group $resourceGroup `
    --template-file function-app.bicep `
    --parameters functionAppName=$functionAppName `
                 storageAccountName=$storageAccountName `
                 location=$location `
                 apiSecret=$apiSecret `
                 environment=$Environment `
    --output json | ConvertFrom-Json

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Infrastructure deployment failed" -ForegroundColor Red
    exit 1
}

$functionAppUrl = $deploymentResult.properties.outputs.functionAppUrl.value
Write-Host "Function App URL: $functionAppUrl" -ForegroundColor Green

# Build and deploy function code
Write-Host "Building and deploying function code..." -ForegroundColor Cyan

Push-Location $repoRoot

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Build failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Deploy using Azure Functions Core Tools
npx func azure functionapp publish $functionAppName --typescript

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Function deployment failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

# Test deployment
Write-Host "Testing deployment..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

try {
    $healthResponse = Invoke-RestMethod -Uri "$functionAppUrl/api/health" -Method Get
    Write-Host "Health check passed: $($healthResponse.status)" -ForegroundColor Green
} catch {
    Write-Host "Warning: Health check failed - $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`nDeployment completed successfully!" -ForegroundColor Green
Write-Host "Function App URL: $functionAppUrl" -ForegroundColor Cyan
Write-Host "API Endpoints:" -ForegroundColor Cyan
Write-Host "  - Health: $functionAppUrl/api/health" -ForegroundColor Gray
Write-Host "  - API Documentation: $functionAppUrl/api/docs" -ForegroundColor Gray
Write-Host "  - OpenAPI Spec: $functionAppUrl/api/openapi.json" -ForegroundColor Gray
Write-Host "  - Extract Fields: $functionAppUrl/api/pdf/extract-fields" -ForegroundColor Gray
Write-Host "  - Fill Form: $functionAppUrl/api/pdf/fill-form" -ForegroundColor Gray