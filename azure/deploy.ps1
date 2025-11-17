# Parse command line arguments
param(
    [Parameter(Position=0)]
    [string]$Environment
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
        Write-Host "  $name=$value"
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

az config set core.login_experience_v2=off # Disable the new login experience to avoid console prompts
az login --tenant $tenantId

az account set --subscription $subscriptionId
az group create --name $resourceGroup --location $location

az deployment group create `
    --name pdf-lib-deployment `
    --resource-group $resourceGroup `
    --template-file main.bicep `
    --parameters containerGroupName=$containerGroupName `
    storageAccountName=$storageAccountName `
    location=$location `
    apiSecret=$apiSecret `
    apiBaseUrl=$apiBaseUrl
