# Azure PowerShell Deployment Script for Group Tree Membership Visualizer
# No GitHub account required!
#
# Prerequisites:
# - Azure PowerShell module installed (Install-Module -Name Az)
# - Node.js 18+ installed
# - Azure subscription access

# Configuration
$resourceGroupName = "rg-group-tree-visualizer"
$staticWebAppName = "group-tree-visualizer-$(Get-Random -Minimum 1000 -Maximum 9999)"
$location = "East US 2"

Write-Host "🚀 Group Tree Membership Visualizer - PowerShell Deployment" -ForegroundColor Green
Write-Host "=============================================================" -ForegroundColor Green

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   Resource Group: $resourceGroupName"
Write-Host "   Static Web App: $staticWebAppName"
Write-Host "   Location: $location"
Write-Host ""

# Check if Azure PowerShell is installed
try {
    Get-Module -Name Az -ListAvailable | Out-Null
} catch {
    Write-Host "❌ Azure PowerShell module is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   Install-Module -Name Az -Repository PSGallery -Force" -ForegroundColor Yellow
    exit 1
}

# Check if Node.js is installed
try {
    node --version | Out-Null
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first:" -ForegroundColor Red
    Write-Host "   https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Login to Azure
Write-Host "🔐 Logging into Azure..." -ForegroundColor Blue
Connect-AzAccount

# Create resource group
Write-Host "📁 Creating resource group..." -ForegroundColor Blue
New-AzResourceGroup -Name $resourceGroupName -Location $location -Force

# Download and extract source code
Write-Host "⬇️  Downloading source code..." -ForegroundColor Blue
$sourceUrl = "https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/archive/refs/heads/main.zip"
$sourceZip = "source.zip"
$extractPath = "Group-Tree-Membership-Visualizer-main"

# Clean up existing files
if (Test-Path $extractPath) {
    Remove-Item -Path $extractPath -Recurse -Force
}
if (Test-Path $sourceZip) {
    Remove-Item -Path $sourceZip -Force
}

# Download source
Invoke-WebRequest -Uri $sourceUrl -OutFile $sourceZip

# Extract source
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($sourceZip, ".")

# Navigate to source directory
Set-Location -Path $extractPath

# Install dependencies and build
Write-Host "🔨 Building application..." -ForegroundColor Blue
npm install --silent
npm run build

# Create Static Web App using ARM template
Write-Host "☁️  Creating Azure Static Web App..." -ForegroundColor Blue
$templateUri = "https://raw.githubusercontent.com/OfirGavish/Group-Tree-Membership-Visualizer/main/azuredeploy.json"

$deploymentResult = New-AzResourceGroupDeployment `
    -ResourceGroupName $resourceGroupName `
    -TemplateUri $templateUri `
    -siteName $staticWebAppName `
    -location $location `
    -repositoryUrl "https://github.com/OfirGavish/Group-Tree-Membership-Visualizer" `
    -branch "main"

# Get the Static Web App URL
$webAppUrl = $deploymentResult.Outputs.staticWebAppUrl.Value

Write-Host ""
Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Your application URL: $webAppUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to Azure Portal: https://portal.azure.com"
Write-Host "2. Navigate to: Resource Groups → $resourceGroupName → $staticWebAppName"
Write-Host "3. Click 'Authentication' in the left menu"
Write-Host "4. Add Microsoft identity provider"
Write-Host "5. Visit your app URL and test!"
Write-Host ""
Write-Host "📖 For detailed configuration steps, see:" -ForegroundColor Magenta
Write-Host "   https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/blob/main/DEPLOYMENT_GUIDE.md"
Write-Host ""
Write-Host "🎉 Happy visualizing!" -ForegroundColor Green

# Return to original directory
Set-Location -Path ".."

# Clean up
Remove-Item -Path $sourceZip -Force
Write-Host "🧹 Cleaned up temporary files." -ForegroundColor Gray
