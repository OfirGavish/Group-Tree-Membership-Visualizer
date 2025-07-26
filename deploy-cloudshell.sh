#!/bin/bash

# 🌳 Group Tree Membership Visualizer - Azure Cloud Shell Deployment Script
# This script deploys the application using Azure Cloud Shell - no GitHub required!

set -e

echo "🌳 Group Tree Membership Visualizer - Cloud Shell Deployment"
echo "============================================================="
echo ""

# Default values
DEFAULT_APP_NAME="group-tree-visualizer-$(date +%Y%m%d%H%M)"
DEFAULT_LOCATION="East US 2"
DEFAULT_RESOURCE_GROUP="rg-group-visualizer"
DOWNLOAD_URL="https://storage.mscloudninja.com/releases/group-tree-visualizer-latest.zip"

# Interactive parameter collection
echo "📝 Deployment Configuration:"
echo ""

read -p "🏷️  Static Web App Name [$DEFAULT_APP_NAME]: " STATIC_WEB_APP_NAME
STATIC_WEB_APP_NAME=${STATIC_WEB_APP_NAME:-$DEFAULT_APP_NAME}

read -p "🌍 Azure Region [$DEFAULT_LOCATION]: " LOCATION
LOCATION=${LOCATION:-$DEFAULT_LOCATION}

read -p "📁 Resource Group [$DEFAULT_RESOURCE_GROUP]: " RESOURCE_GROUP
RESOURCE_GROUP=${RESOURCE_GROUP:-$DEFAULT_RESOURCE_GROUP}

echo ""
echo "🎯 Deployment Summary:"
echo "   App Name: $STATIC_WEB_APP_NAME"
echo "   Location: $LOCATION"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   Download URL: $DOWNLOAD_URL"
echo ""

read -p "✅ Proceed with deployment? (y/N): " CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

echo ""
echo "🚀 Starting deployment..."
echo ""

# Step 1: Create resource group if it doesn't exist
echo "📁 Creating resource group..."
if az group show --name "$RESOURCE_GROUP" --output none 2>/dev/null; then
    echo "✅ Resource group '$RESOURCE_GROUP' already exists"
else
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
    echo "✅ Resource group '$RESOURCE_GROUP' created"
fi

# Step 2: Create Static Web App
echo "🌐 Creating Static Web App..."
az staticwebapp create \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --source "https://github.com/Azure-Samples/static-web-apps-blank" \
    --branch "main" \
    --app-location "/" \
    --output-location "/"

echo "✅ Static Web App '$STATIC_WEB_APP_NAME' created"

# Step 3: Get deployment token
echo "🔑 Retrieving deployment token..."
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.apiKey" \
    --output tsv)

if [ -z "$DEPLOYMENT_TOKEN" ] || [ "$DEPLOYMENT_TOKEN" = "null" ]; then
    echo "❌ Failed to retrieve deployment token"
    exit 1
fi

echo "✅ Deployment token retrieved (${#DEPLOYMENT_TOKEN} characters)"

# Step 4: Download application files
echo "📥 Downloading application package..."
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

# Try multiple download methods
DOWNLOAD_SUCCESS=false

echo "📥 Trying primary URL: $DOWNLOAD_URL"
if curl -L --fail --connect-timeout 30 --max-time 180 "$DOWNLOAD_URL" -o "release.zip"; then
    echo "✅ Downloaded from primary URL"
    DOWNLOAD_SUCCESS=true
else
    echo "❌ Primary URL failed, trying GitHub fallback..."
    GITHUB_URL="https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/releases/latest/download/group-tree-visualizer-latest.zip"
    if curl -L --fail --connect-timeout 30 --max-time 180 "$GITHUB_URL" -o "release.zip"; then
        echo "✅ Downloaded from GitHub fallback"
        DOWNLOAD_SUCCESS=true
    fi
fi

if [ "$DOWNLOAD_SUCCESS" = false ]; then
    echo "❌ Failed to download application package"
    exit 1
fi

# Step 5: Extract files
echo "📦 Extracting application files..."
unzip -q "release.zip"
rm "release.zip"

# Find the static files
STATIC_DIR="."
if [ -d "static" ]; then
    STATIC_DIR="static"
elif [ -d "out" ]; then
    STATIC_DIR="out"
elif [ -d "dist" ]; then
    STATIC_DIR="dist"
fi

echo "📂 Using static files from: $STATIC_DIR"
FILE_COUNT=$(find "$STATIC_DIR" -type f | wc -l)
echo "📊 Found $FILE_COUNT files to deploy"

# Step 6: Install SWA CLI and deploy
echo "📦 Installing SWA CLI..."
npm install -g @azure/static-web-apps-cli

echo "🚀 Deploying application..."
cd "$STATIC_DIR"

if swa deploy . --deployment-token "$DEPLOYMENT_TOKEN" --verbose; then
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "📊 Deployment Summary:"
    echo "   📱 Application URL: https://$STATIC_WEB_APP_NAME.azurestaticapps.net"
    echo "   📁 Resource Group: $RESOURCE_GROUP"
    echo "   🌍 Region: $LOCATION"
    echo "   📦 Files Deployed: $FILE_COUNT"
    echo ""
    echo "🔧 Next Steps:"
    echo "   1. 🌐 Visit your application: https://$STATIC_WEB_APP_NAME.azurestaticapps.net"
    echo "   2. 🔐 Configure MSAL authentication:"
    echo "      curl -s https://raw.githubusercontent.com/OfirGavish/Group-Tree-Membership-Visualizer/main/configure-app.ps1 > configure-app.ps1"
    echo "      pwsh ./configure-app.ps1 -StaticWebAppName '$STATIC_WEB_APP_NAME'"
    echo ""
    echo "✨ Deployment Complete! ✨"
else
    echo "❌ Deployment failed"
    echo "🔍 Troubleshooting info:"
    echo "   Token length: ${#DEPLOYMENT_TOKEN}"
    echo "   Working directory: $(pwd)"
    echo "   Files available: $(ls -la | head -10)"
    exit 1
fi

# Cleanup
cd /
rm -rf "$TEMP_DIR"
echo "🧹 Temporary files cleaned up"
