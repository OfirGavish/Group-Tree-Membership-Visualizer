@echo off
REM Windows Batch Deployment Script for Group Tree Membership Visualizer
REM No GitHub account required!
REM
REM Prerequisites:
REM - Azure CLI installed (https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
REM - Node.js 18+ installed (https://nodejs.org/)
REM - Azure subscription access

echo.
echo 🚀 Group Tree Membership Visualizer - Windows Deployment
echo =======================================================
echo.

REM Configuration
set RESOURCE_GROUP_NAME=rg-group-tree-visualizer
set STATIC_WEBAPP_NAME=group-tree-visualizer-%RANDOM%
set LOCATION=eastus2
set SKU=Free

echo 📋 Configuration:
echo    Resource Group: %RESOURCE_GROUP_NAME%
echo    Static Web App: %STATIC_WEBAPP_NAME%
echo    Location: %LOCATION%
echo    SKU: %SKU%
echo.

REM Check if Azure CLI is installed
az --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Azure CLI is not installed. Please install it first:
    echo    https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first:
    echo    https://nodejs.org/
    pause
    exit /b 1
)

REM Login to Azure
echo 🔐 Logging into Azure...
call az login
if %errorlevel% neq 0 (
    echo ❌ Azure login failed
    pause
    exit /b 1
)

REM Create resource group
echo 📁 Creating resource group...
call az group create --name "%RESOURCE_GROUP_NAME%" --location "%LOCATION%" --output table
if %errorlevel% neq 0 (
    echo ❌ Failed to create resource group
    pause
    exit /b 1
)

REM Download source code
echo ⬇️  Downloading source code...
if exist "Group-Tree-Membership-Visualizer-main" (
    rmdir /s /q "Group-Tree-Membership-Visualizer-main"
)
if exist "source.zip" (
    del "source.zip"
)

powershell -Command "Invoke-WebRequest -Uri 'https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/archive/refs/heads/main.zip' -OutFile 'source.zip'"
if %errorlevel% neq 0 (
    echo ❌ Failed to download source code
    pause
    exit /b 1
)

REM Extract source code
echo 📦 Extracting source code...
powershell -Command "Expand-Archive -Path 'source.zip' -DestinationPath '.' -Force"
if %errorlevel% neq 0 (
    echo ❌ Failed to extract source code
    pause
    exit /b 1
)

cd "Group-Tree-Membership-Visualizer-main"

REM Install dependencies and build
echo 🔨 Building application...
call npm install --silent
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build application
    pause
    exit /b 1
)

REM Deploy using ARM template
echo ☁️  Creating Azure Static Web App...
call az deployment group create ^
  --resource-group "%RESOURCE_GROUP_NAME%" ^
  --template-uri "https://raw.githubusercontent.com/OfirGavish/Group-Tree-Membership-Visualizer/main/azuredeploy-direct.json" ^
  --parameters siteName="%STATIC_WEBAPP_NAME%" location="%LOCATION%" ^
  --output table

if %errorlevel% neq 0 (
    echo ❌ Failed to create Static Web App
    pause
    exit /b 1
)

REM Get the Static Web App URL
echo 🔍 Getting application URL...
for /f "tokens=*" %%i in ('az staticwebapp show --name "%STATIC_WEBAPP_NAME%" --resource-group "%RESOURCE_GROUP_NAME%" --query "defaultHostname" --output tsv') do set WEBAPP_URL=%%i

echo.
echo ✅ Deployment completed successfully!
echo.
echo 🌐 Your application URL: https://%WEBAPP_URL%
echo.
echo 🔧 Next steps:
echo 1. Go to Azure Portal: https://portal.azure.com
echo 2. Navigate to: Resource Groups → %RESOURCE_GROUP_NAME% → %STATIC_WEBAPP_NAME%
echo 3. Click 'Authentication' in the left menu
echo 4. Add Microsoft identity provider
echo 5. Visit your app URL and test!
echo.
echo 📖 For detailed configuration steps, see:
echo    https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/blob/main/DEPLOYMENT_GUIDE.md
echo.
echo 🎉 Happy visualizing!
echo.

REM Clean up
cd ..
del "source.zip"
echo 🧹 Cleaned up temporary files.
echo.

pause
