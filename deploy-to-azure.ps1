# Group Tree Membership Visualizer - Direct Deployment Script
# This script builds and deploys the application directly to Azure Static Web Apps

param(
    [Parameter(Mandatory=$true, HelpMessage="Name for your new Azure Static Web App")]
    [string]$StaticWebAppName,
    
    [Parameter(Mandatory=$false, HelpMessage="Azure location for the Static Web App")]
    [string]$Location = "East US 2",
    
    [Parameter(Mandatory=$false, HelpMessage="Resource Group name")]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$false, HelpMessage="Skip building the application")]
    [switch]$SkipBuild
)

Write-Host "Group Tree Membership Visualizer - Direct Deployment" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Green

# Check Node.js
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Node.js version: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Error "Node.js is required but not found. Please install Node.js from https://nodejs.org/"
        exit 1
    }
} catch {
    Write-Error "Node.js is required but not found. Please install Node.js from https://nodejs.org/"
    exit 1
}

# Check Azure CLI
try {
    $azVersion = az version --output tsv --query '"azure-cli"' 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Azure CLI version: $azVersion" -ForegroundColor Green
    } else {
        Write-Error "Azure CLI is required but not found. Please install from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    }
} catch {
    Write-Error "Azure CLI is required but not found. Please install from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
}

# Check if Static Web Apps extension is installed
$swaExtension = az extension list --query "[?name=='staticwebapp']" --output tsv 2>$null
if (!$swaExtension) {
    Write-Host "  Installing Azure Static Web Apps CLI extension..." -ForegroundColor Yellow
    az extension add --name staticwebapp --yes
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install Static Web Apps extension"
        exit 1
    }
} else {
    Write-Host "  Azure Static Web Apps extension is installed" -ForegroundColor Green
}

# Check if SWA CLI is installed
try {
    $swaCliVersion = swa --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  SWA CLI version: $swaCliVersion" -ForegroundColor Green
    } else {
        Write-Host "  Installing SWA CLI..." -ForegroundColor Yellow
        npm install -g @azure/static-web-apps-cli
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Failed to install SWA CLI globally. Proceeding without it."
        }
    }
} catch {
    Write-Host "  Installing SWA CLI..." -ForegroundColor Yellow
    npm install -g @azure/static-web-apps-cli
}

# Ensure we're in the right directory
if (!(Test-Path "package.json")) {
    Write-Error "package.json not found. Please run this script from the project root directory."
    exit 1
}

# Build the application
if (!$SkipBuild) {
    Write-Host "Building the application..." -ForegroundColor Green
    
    # Install dependencies
    Write-Host "  Installing dependencies..." -ForegroundColor Blue
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install dependencies"
        exit 1
    }
    
    # Build the application
    Write-Host "  Building Next.js application..." -ForegroundColor Blue
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build the application"
        exit 1
    }
    
    # Export static files
    Write-Host "  Exporting static files..." -ForegroundColor Blue
    npm run export
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to export static files"
        exit 1
    }
    
    Write-Host "Application built successfully!" -ForegroundColor Green
} else {
    Write-Host "Skipping build (using existing build)..." -ForegroundColor Yellow
}

# Connect to Azure
Write-Host "Connecting to Azure..." -ForegroundColor Green
$currentAccount = az account show --query "user.name" --output tsv 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Please sign in to Azure..." -ForegroundColor Blue
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to sign in to Azure"
        exit 1
    }
} else {
    Write-Host "  Already signed in as: $currentAccount" -ForegroundColor Green
    $response = Read-Host "  Continue with this account? (Y/n)"
    if ($response -eq 'n' -or $response -eq 'N') {
        az login
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to sign in to Azure"
            exit 1
        }
    }
}

# Get or create resource group
if (!$ResourceGroupName) {
    $ResourceGroupName = "${StaticWebAppName}-rg"
}

Write-Host "Checking resource group: $ResourceGroupName..." -ForegroundColor Green
$rgExists = az group exists --name $ResourceGroupName --output tsv
if ($rgExists -eq "false") {
    Write-Host "  Creating resource group: $ResourceGroupName..." -ForegroundColor Blue
    az group create --name $ResourceGroupName --location $Location
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to create resource group"
        exit 1
    }
} else {
    Write-Host "  Resource group exists: $ResourceGroupName" -ForegroundColor Green
}

# Create Static Web App
Write-Host "Creating Azure Static Web App: $StaticWebAppName..." -ForegroundColor Green
$swaResult = az staticwebapp create `
    --name $StaticWebAppName `
    --resource-group $ResourceGroupName `
    --location $Location `
    --source "." `
    --branch "main" `
    --app-location "/" `
    --output-location "out" `
    --login-with-github $false `
    --query "{name:name,defaultHostname:defaultHostname,resourceGroup:resourceGroup}" `
    --output json

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create Static Web App"
    exit 1
}

$swaInfo = $swaResult | ConvertFrom-Json
$appUrl = "https://$($swaInfo.defaultHostname)"

Write-Host "Static Web App created successfully!" -ForegroundColor Green
Write-Host "  Name: $($swaInfo.name)" -ForegroundColor Blue
Write-Host "  URL: $appUrl" -ForegroundColor Blue
Write-Host "  Resource Group: $($swaInfo.resourceGroup)" -ForegroundColor Blue

# Deploy the built application
Write-Host "Deploying application..." -ForegroundColor Green

# Get deployment token
$deploymentToken = az staticwebapp secrets list --name $StaticWebAppName --resource-group $ResourceGroupName --query "properties.apiKey" --output tsv

if (!$deploymentToken) {
    Write-Error "Failed to get deployment token"
    exit 1
}

# Deploy using SWA CLI
Write-Host "  Uploading files to Azure Static Web Apps..." -ForegroundColor Blue

# Create a temporary swa-cli.config.json for deployment
$swaConfig = @{
    "$schema" = "https://aka.ms/azure/static-web-apps-cli/schema"
    configurations = @{
        app = @{
            outputLocation = "out"
            apiLocation = "api"
        }
    }
} | ConvertTo-Json -Depth 10

$swaConfig | Out-File -FilePath "swa-cli.config.json" -Encoding UTF8

try {
    # Deploy using swa deploy command
    swa deploy --deployment-token $deploymentToken --app-location "." --output-location "out" --api-location "api"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Application deployed successfully!" -ForegroundColor Green
    } else {
        Write-Warning "SWA CLI deployment failed. Trying alternative method..."
        
        # Alternative: Use Azure CLI staticwebapp deployment
        Write-Host "  Trying Azure CLI deployment..." -ForegroundColor Blue
        
        # Create a zip file of the build output
        if (Get-Command Compress-Archive -ErrorAction SilentlyContinue) {
            $tempZip = "temp-deployment.zip"
            if (Test-Path $tempZip) { Remove-Item $tempZip }
            
            Compress-Archive -Path "out/*" -DestinationPath $tempZip
            
            # Deploy the zip file
            az staticwebapp environment set --name $StaticWebAppName --resource-group $ResourceGroupName --environment-name "default" --source $tempZip
            
            # Clean up
            Remove-Item $tempZip
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Application deployed successfully using Azure CLI!" -ForegroundColor Green
            } else {
                Write-Error "Deployment failed. Please check the Azure portal for more details."
            }
        } else {
            Write-Error "Deployment failed and Compress-Archive is not available. Please deploy manually."
        }
    }
} finally {
    # Clean up temporary config file
    if (Test-Path "swa-cli.config.json") {
        Remove-Item "swa-cli.config.json"
    }
}

# Summary
Write-Host ""
Write-Host "Deployment Complete!" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your Group Tree Membership Visualizer has been deployed!" -ForegroundColor White
Write-Host ""
Write-Host "Application Details:" -ForegroundColor White
Write-Host "  Name: $StaticWebAppName" -ForegroundColor Blue
Write-Host "  URL: $appUrl" -ForegroundColor Green
Write-Host "  Resource Group: $ResourceGroupName" -ForegroundColor Blue
Write-Host "  Location: $Location" -ForegroundColor Blue
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor White
Write-Host "  1. Run the configuration script to set up Azure AD:" -ForegroundColor Yellow
Write-Host "     .\configure-app.ps1 -StaticWebAppName '$StaticWebAppName'" -ForegroundColor Blue
Write-Host "  2. Visit your application: $appUrl" -ForegroundColor Yellow
Write-Host "  3. Test the authentication and group visualization features" -ForegroundColor Yellow
Write-Host ""
Write-Host "Documentation:" -ForegroundColor White
Write-Host "  Setup Guide: https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/blob/main/SETUP_GUIDE.md" -ForegroundColor Blue
Write-Host "  Troubleshooting: https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/blob/main/TROUBLESHOOTING.md" -ForegroundColor Blue
Write-Host ""
