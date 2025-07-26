# Deploy Group Tree Membership Visualizer using Bicep
# This script deploys the application using Azure Bicep instead of ARM templates

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$false)]
    [string]$StaticWebAppName = "ESI-GroupTreeMembership",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "East US 2",
    
    [Parameter(Mandatory=$false)]
    [string]$SubscriptionId
)

Write-Host "🌳 Deploying Group Tree Membership Visualizer with Bicep" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan

# Set subscription if provided
if ($SubscriptionId) {
    Write-Host "🔄 Setting subscription to: $SubscriptionId" -ForegroundColor Yellow
    az account set --subscription $SubscriptionId
}

# Verify Azure CLI login
Write-Host "🔍 Checking Azure CLI authentication..." -ForegroundColor Yellow
$account = az account show --query 'user.name' -o tsv 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Please login to Azure CLI first: az login" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Authenticated as: $account" -ForegroundColor Green

# Check if resource group exists
Write-Host "🔍 Checking resource group: $ResourceGroupName" -ForegroundColor Yellow
$rgExists = az group exists --name $ResourceGroupName 2>$null
if ($rgExists -eq "false") {
    Write-Host "📁 Creating resource group: $ResourceGroupName" -ForegroundColor Yellow
    az group create --name $ResourceGroupName --location $Location
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create resource group" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Resource group created" -ForegroundColor Green
} else {
    Write-Host "✅ Resource group exists" -ForegroundColor Green
}

# Deploy using Bicep
Write-Host "🚀 Starting Bicep deployment..." -ForegroundColor Yellow
Write-Host "📊 Parameters:" -ForegroundColor Cyan
Write-Host "  🏷️  Static Web App Name: $StaticWebAppName" -ForegroundColor White
Write-Host "  📍 Location: $Location" -ForegroundColor White
Write-Host "  🏠 Resource Group: $ResourceGroupName" -ForegroundColor White

$deploymentName = "bicep-deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

az deployment group create `
    --resource-group $ResourceGroupName `
    --template-file "main.bicep" `
    --parameters staticWebAppName=$StaticWebAppName location=$Location `
    --name $deploymentName `
    --verbose

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Bicep deployment completed successfully!" -ForegroundColor Green
    
    # Get deployment outputs
    Write-Host "📊 Getting deployment outputs..." -ForegroundColor Yellow
    $outputs = az deployment group show --resource-group $ResourceGroupName --name $deploymentName --query 'properties.outputs' -o json | ConvertFrom-Json
    
    if ($outputs) {
        Write-Host "🎉 Deployment Results:" -ForegroundColor Green
        Write-Host "================================" -ForegroundColor Cyan
        Write-Host "🌐 App URL: $($outputs.staticWebAppUrl.value)" -ForegroundColor White
        Write-Host "🏷️  App Name: $($outputs.staticWebAppName.value)" -ForegroundColor White
        Write-Host "🏢 Tenant ID: $($outputs.tenantId.value)" -ForegroundColor White
        Write-Host "📊 Subscription: $($outputs.subscriptionId.value)" -ForegroundColor White
        Write-Host "🏠 Resource Group: $($outputs.resourceGroupName.value)" -ForegroundColor White
        
        Write-Host "`n🔧 Next Steps:" -ForegroundColor Yellow
        Write-Host "1. Wait for the deployment script to complete (check Azure portal)" -ForegroundColor White
        Write-Host "2. Configure MSAL authentication:" -ForegroundColor White
        Write-Host "   Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/OfirGavish/Group-Tree-Membership-Visualizer/main/configure-app.ps1' -OutFile 'configure-app.ps1'" -ForegroundColor Gray
        Write-Host "   .\configure-app.ps1 -StaticWebAppName '$($outputs.staticWebAppName.value)'" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Bicep deployment failed" -ForegroundColor Red
    Write-Host "🔍 Check the deployment details in Azure portal for more information" -ForegroundColor Yellow
    exit 1
}
