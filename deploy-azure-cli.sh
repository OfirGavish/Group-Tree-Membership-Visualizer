#!/bin/bash

# Azure CLI Deployment Script for Group Tree Membership Visualizer
# No GitHub account required!
#
# Prerequisites:
# - Azure CLI installed (https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
# - Node.js 18+ installed
# - Azure subscription access

set -e

echo "🚀 Group Tree Membership Visualizer - Azure CLI Deployment"
echo "=========================================================="

# Configuration
RESOURCE_GROUP_NAME="rg-group-tree-visualizer"
STATIC_WEBAPP_NAME="group-tree-visualizer-$(shuf -i 1000-9999 -n 1)"
LOCATION="eastus2"
SKU="Free"

echo "📋 Configuration:"
echo "   Resource Group: $RESOURCE_GROUP_NAME"
echo "   Static Web App: $STATIC_WEBAPP_NAME"
echo "   Location: $LOCATION"
echo "   SKU: $SKU"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first:"
    echo "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first:"
    echo "   https://nodejs.org/"
    exit 1
fi

# Login to Azure
echo "🔐 Logging into Azure..."
az login

# Create resource group
echo "📁 Creating resource group..."
az group create \
  --name "$RESOURCE_GROUP_NAME" \
  --location "$LOCATION" \
  --output table

# Download and extract source code
echo "⬇️  Downloading source code..."
if [ -d "Group-Tree-Membership-Visualizer-main" ]; then
    rm -rf "Group-Tree-Membership-Visualizer-main"
fi

curl -L -o source.zip "https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/archive/refs/heads/main.zip"
unzip -q source.zip
cd "Group-Tree-Membership-Visualizer-main"

# Install dependencies and build
echo "🔨 Building application..."
npm install --silent
npm run build

# Create Static Web App
echo "☁️  Creating Azure Static Web App..."
az staticwebapp create \
  --name "$STATIC_WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --location "$LOCATION" \
  --sku "$SKU" \
  --output table

# Get the Static Web App URL
echo "🔍 Getting application URL..."
WEBAPP_URL=$(az staticwebapp show \
  --name "$STATIC_WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --query "defaultHostname" \
  --output tsv)

# Upload build files
echo "📤 Uploading application files..."
az staticwebapp environment set \
  --name "$STATIC_WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP_NAME" \
  --source "./out"

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Your application URL: https://$WEBAPP_URL"
echo ""
echo "🔧 Next steps:"
echo "1. Go to Azure Portal: https://portal.azure.com"
echo "2. Navigate to: Resource Groups → $RESOURCE_GROUP_NAME → $STATIC_WEBAPP_NAME"
echo "3. Click 'Authentication' in the left menu"
echo "4. Add Microsoft identity provider"
echo "5. Visit your app URL and test!"
echo ""
echo "📖 For detailed configuration steps, see:"
echo "   https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/blob/main/DEPLOYMENT_GUIDE.md"
echo ""
echo "🎉 Happy visualizing!"
