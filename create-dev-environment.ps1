# Create Development Static Web App Script
# This script creates a separate Static Web App for development purposes

param(
    [Parameter(Mandatory=$false, HelpMessage="Name for your development Static Web App")]
    [string]$DevStaticWebAppName = "group-tree-visualizer-dev",
    
    [Parameter(Mandatory=$false, HelpMessage="Resource Group for development resources")]
    [string]$DevResourceGroupName = "rg-group-tree-dev",
    
    [Parameter(Mandatory=$false, HelpMessage="Azure location")]
    [string]$Location = "West Europe"
)

Write-Host "Creating Development Static Web App..." -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is available
try {
    $azOutput = az version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Azure CLI is available" -ForegroundColor Green
    } else {
        Write-Error "❌ Azure CLI is required but not found."
        exit 1
    }
} catch {
    Write-Error "❌ Azure CLI is required but not found."
    exit 1
}

# Check if logged in
$currentAccount = az account show --query "user.name" --output tsv 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please sign in to Azure..." -ForegroundColor Blue
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to sign in to Azure"
        exit 1
    }
} else {
    Write-Host "✅ Signed in as: $currentAccount" -ForegroundColor Green
}

# Create or check resource group
Write-Host "Setting up resource group: $DevResourceGroupName..." -ForegroundColor Green
$rgExists = az group exists --name $DevResourceGroupName --output tsv
if ($rgExists -eq "false") {
    Write-Host "  Creating resource group..." -ForegroundColor Blue
    az group create --name $DevResourceGroupName --location $Location
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to create resource group"
        exit 1
    }
} else {
    Write-Host "  Resource group already exists" -ForegroundColor Yellow
}

# Create development Static Web App
Write-Host "Creating development Static Web App: $DevStaticWebAppName..." -ForegroundColor Green
Write-Host "Note: You'll need to authenticate with GitHub when prompted." -ForegroundColor Yellow
$swaResult = az staticwebapp create `
    --name $DevStaticWebAppName `
    --resource-group $DevResourceGroupName `
    --location $Location `
    --source "https://github.com/OfirGavish/Group-Tree-Membership-Visualizer" `
    --branch "develop" `
    --app-location "/" `
    --output-location "out" `
    --api-location "api" `
    --login-with-github `
    --query "{name:name,defaultHostname:defaultHostname,resourceGroup:resourceGroup}" `
    --output json

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create Static Web App"
    exit 1
}

$swaInfo = $swaResult | ConvertFrom-Json
$devAppUrl = "https://$($swaInfo.defaultHostname)"

Write-Host ""
Write-Host "✅ Development Static Web App created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Development Environment Details:" -ForegroundColor White
Write-Host "  Name: $($swaInfo.name)" -ForegroundColor Blue
Write-Host "  URL: $devAppUrl" -ForegroundColor Blue
Write-Host "  Resource Group: $($swaInfo.resourceGroup)" -ForegroundColor Blue
Write-Host "  Branch: develop" -ForegroundColor Blue
Write-Host ""

# Get the deployment token for the development environment
Write-Host "Getting deployment token for GitHub Actions..." -ForegroundColor Green
$deploymentToken = az staticwebapp secrets list --name $DevStaticWebAppName --resource-group $DevResourceGroupName --query "properties.apiKey" --output tsv

if ($deploymentToken) {
    Write-Host "✅ Deployment token retrieved" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor White
    Write-Host "1. Add this secret to your GitHub repository:" -ForegroundColor Yellow
    Write-Host "   Go to: https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/settings/secrets/actions" -ForegroundColor Blue
    Write-Host "   Secret Name: AZURE_STATIC_WEB_APPS_API_TOKEN_DEV" -ForegroundColor Blue
    Write-Host "   Secret Value: [The deployment token - shown below]" -ForegroundColor Blue
    Write-Host ""
    Write-Host "2. Deployment Token (copy this to GitHub secrets):" -ForegroundColor Yellow
    Write-Host $deploymentToken -ForegroundColor Green
    Write-Host ""
    Write-Host "3. Update your workflow to deploy to the develop branch" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "4. Configure Azure AD for your development environment:" -ForegroundColor Yellow
    Write-Host "   .\configure-app.ps1 -StaticWebAppName '$DevStaticWebAppName'" -ForegroundColor Blue
    Write-Host ""
} else {
    Write-Warning "Failed to retrieve deployment token. You can get it later from the Azure Portal."
}

Write-Host "Development environment is ready! 🚀" -ForegroundColor Green
