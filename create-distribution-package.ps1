# Create Distribution Package Script
# This script creates a deployment package for easy distribution

param(
    [Parameter(Mandatory=$false, HelpMessage="Package name")]
    [string]$PackageName = "group-visualizer-deployment-$(Get-Date -Format 'yyyy-MM-dd')"
)

Write-Host "Creating Distribution Package..." -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (!(Test-Path "package.json")) {
    Write-Error "package.json not found. Please run this script from the project root directory."
    exit 1
}

# Build the application
Write-Host "Building the application..." -ForegroundColor Green
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to install dependencies"
    exit 1
}

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to build the application"
    exit 1
}

npm run export
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to export static files"
    exit 1
}

# Create distribution directory
Write-Host "Creating distribution package..." -ForegroundColor Green
if (Test-Path $PackageName) {
    Remove-Item $PackageName -Recurse -Force
}
New-Item -ItemType Directory -Path $PackageName | Out-Null

# Copy essential files for deployment
Write-Host "  Copying built application..." -ForegroundColor Blue
Copy-Item -Path "out" -Destination "$PackageName/" -Recurse
Copy-Item -Path "api" -Destination "$PackageName/" -Recurse

# Copy deployment scripts
Write-Host "  Copying deployment scripts..." -ForegroundColor Blue
Copy-Item -Path "deploy-to-azure.ps1" -Destination "$PackageName/"
Copy-Item -Path "configure-app.ps1" -Destination "$PackageName/"

# Copy configuration files
Write-Host "  Copying configuration files..." -ForegroundColor Blue
Copy-Item -Path "package.json" -Destination "$PackageName/"
Copy-Item -Path "next.config.js" -Destination "$PackageName/"
Copy-Item -Path "staticwebapp.config.json" -Destination "$PackageName/"

# Copy documentation
Write-Host "  Copying documentation..." -ForegroundColor Blue
Copy-Item -Path "README.md" -Destination "$PackageName/"
Copy-Item -Path "DEPLOYMENT_GUIDE.md" -Destination "$PackageName/"
Copy-Item -Path "SETUP_GUIDE.md" -Destination "$PackageName/" -ErrorAction SilentlyContinue
Copy-Item -Path "TROUBLESHOOTING.md" -Destination "$PackageName/" -ErrorAction SilentlyContinue

# Create deployment instructions
$instructions = @"
# Group Tree Membership Visualizer - Deployment Package

## Quick Start

1. **Prerequisites:**
   - Node.js 18+ installed
   - Azure CLI installed
   - Azure subscription with contributor access

2. **Deploy to Azure:**
   ``````powershell
   .\deploy-to-azure.ps1 -StaticWebAppName "YourAppName" -Location "East US 2"
   ``````

3. **Configure Azure AD:**
   ``````powershell
   .\configure-app.ps1 -StaticWebAppName "YourAppName"
   ``````

4. **Access your application:**
   - Visit the URL provided by the deployment script
   - Sign in with your organizational Microsoft account
   - Start exploring group memberships!

## Documentation

- **DEPLOYMENT_GUIDE.md**: Complete deployment options and troubleshooting
- **README.md**: Application overview and features
- **SETUP_GUIDE.md**: Detailed setup instructions
- **TROUBLESHOOTING.md**: Common issues and solutions

## Support

For issues and questions:
- Check the documentation files
- Review Azure Static Web Apps logs in Azure Portal
- Verify Azure AD app registration permissions

Generated: $(Get-Date)
Package Version: $PackageName
"@

$instructions | Out-File -FilePath "$PackageName/QUICK_START.md" -Encoding UTF8

# Create zip package
Write-Host "  Creating zip package..." -ForegroundColor Blue
if (Test-Path "$PackageName.zip") {
    Remove-Item "$PackageName.zip"
}
Compress-Archive -Path "$PackageName/*" -DestinationPath "$PackageName.zip"

# Summary
Write-Host ""
Write-Host "Distribution Package Created!" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Package Details:" -ForegroundColor White
Write-Host "  Directory: $PackageName" -ForegroundColor Blue
Write-Host "  Zip File: $PackageName.zip" -ForegroundColor Blue
Write-Host "  Size: $((Get-Item "$PackageName.zip").Length / 1MB) MB" -ForegroundColor Blue
Write-Host ""
Write-Host "Package Contents:" -ForegroundColor White
Write-Host "  ✅ Built application (out/ folder)" -ForegroundColor Green
Write-Host "  ✅ Azure Functions API (api/ folder)" -ForegroundColor Green
Write-Host "  ✅ Deployment scripts" -ForegroundColor Green
Write-Host "  ✅ Configuration files" -ForegroundColor Green
Write-Host "  ✅ Documentation" -ForegroundColor Green
Write-Host ""
Write-Host "Distribution Instructions:" -ForegroundColor White
Write-Host "  1. Share the $PackageName.zip file with users" -ForegroundColor Yellow
Write-Host "  2. Users extract the zip file" -ForegroundColor Yellow
Write-Host "  3. Users run the deployment script" -ForegroundColor Yellow
Write-Host "  4. Users run the configuration script" -ForegroundColor Yellow
Write-Host ""
Write-Host "The package is ready for distribution! 🚀" -ForegroundColor Green
