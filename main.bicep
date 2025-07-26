@description('Name of the Static Web App')
param staticWebAppName string

@description('Location for the Static Web App')
@allowed([
  'East US 2'
  'West US 2'
  'Central US'
  'West Europe'
])
param location string = 'East US 2'

@description('Download URL for the pre-built application package')
param downloadUrl string = 'https://storage.mscloudninja.com/releases/group-tree-visualizer-latest.zip'

@description('Force update tag to ensure deployment script runs every time')
param forceUpdateTag string = newGuid()

// Variables
var identityName = '${staticWebAppName}-identity'
var deploymentScriptName = 'deploy-${staticWebAppName}'

// Static Web App
resource staticWebApp 'Microsoft.Web/staticSites@2022-03-01' = {
  name: staticWebAppName
  location: location
  properties: {
    buildProperties: {
      skipGithubActionWorkflowGeneration: true
    }
  }
  sku: {
    name: 'Free'
    tier: 'Free'
  }
}

// Managed Identity for deployment script
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2018-11-30' = {
  name: identityName
  location: location
}

// Role assignment for the managed identity (Contributor role)
resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(resourceGroup().id, managedIdentity.id, 'Contributor')
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'b24988ac-6180-42a0-ab88-20f7382dd24c') // Contributor
    principalId: managedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// Deployment script to download and deploy the application
resource deploymentScript 'Microsoft.Resources/deploymentScripts@2020-10-01' = {
  name: deploymentScriptName
  location: location
  kind: 'AzureCLI'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  dependsOn: [
    staticWebApp
    roleAssignment
  ]
  properties: {
    forceUpdateTag: forceUpdateTag
    azCliVersion: '2.53.0'
    timeout: 'PT45M'
    retentionInterval: 'P1D'
    cleanupPreference: 'OnFailure'
    environmentVariables: [
      {
        name: 'STATIC_WEB_APP_NAME'
        value: staticWebAppName
      }
      {
        name: 'RESOURCE_GROUP_NAME'
        value: resourceGroup().name
      }
      {
        name: 'DOWNLOAD_URL'
        value: downloadUrl
      }
      {
        name: 'SUBSCRIPTION_ID'
        value: subscription().subscriptionId
      }
    ]
    scriptContent: '''
#!/bin/bash

# 🔧 CRITICAL FIX: Install Static Web App extension first
echo "🔧 Installing/updating Azure CLI Static Web App extension..."
az extension add --name staticwebapp || az extension update --name staticwebapp

echo "🌳 Starting Bicep-powered deployment for $STATIC_WEB_APP_NAME"
echo "📦 Download URL: $DOWNLOAD_URL"
echo "🏠 Resource Group: $RESOURCE_GROUP_NAME"
echo "📅 Date: $(date)"
echo "🔧 Azure CLI Version: $(az version --query '\"azure-cli\"' -o tsv)"

# Enhanced logging function
log() {
    echo "[$(date +'%H:%M:%S')] $1"
}

# Check environment and authentication
log "🔍 Environment check..."
log "📍 Working directory: $(pwd)"
log "👤 Current user context: $(az account show --query 'user.name' -o tsv 2>/dev/null || echo 'Managed Identity')"
log "🏢 Tenant: $(az account show --query 'tenantId' -o tsv 2>/dev/null || echo 'unknown')"
log "📊 Subscription: $(az account show --query 'name' -o tsv 2>/dev/null || echo 'unknown')"

# Don't exit on errors during diagnostics
set +e

log "🔧 Testing Azure CLI functionality..."
az version >/dev/null 2>&1
if [ $? -eq 0 ]; then
    log "✅ Azure CLI is working"
else
    log "❌ Azure CLI test failed"
    exit 1
fi

log "🔍 Testing authentication..."
az account show >/dev/null 2>&1
if [ $? -eq 0 ]; then
    log "✅ Authentication successful"
else
    log "❌ Authentication failed"
    exit 1
fi

log "🔍 Testing Static Web App access..."
az staticwebapp show --name "$STATIC_WEB_APP_NAME" --resource-group "$RESOURCE_GROUP_NAME" >/dev/null 2>&1
if [ $? -eq 0 ]; then
    log "✅ Can access Static Web App"
else
    log "❌ Cannot access Static Web App"
    log "🔍 Listing available static web apps..."
    az staticwebapp list --resource-group "$RESOURCE_GROUP_NAME" --query '[].name' -o tsv 2>/dev/null || echo "Could not list static web apps"
fi

# Re-enable strict error handling
set -e

log "📁 Setting up workspace..."
TEMP_DIR=$(mktemp -d)
log "📍 Temp directory: $TEMP_DIR"

log "📥 Downloading application package..."
# Test connectivity first
if curl -I "$DOWNLOAD_URL" 2>/dev/null | head -1 | grep -q "200"; then
    log "✅ Download URL is accessible"
else
    log "⚠️ Download URL test failed, but continuing..."
fi

# Download with retries
DOWNLOAD_SUCCESS=false
for attempt in 1 2 3; do
    log "📥 Download attempt $attempt/3..."
    if curl -L --fail --connect-timeout 30 --max-time 180 "$DOWNLOAD_URL" -o "$TEMP_DIR/release.zip" 2>&1; then
        log "✅ Download successful on attempt $attempt"
        DOWNLOAD_SUCCESS=true
        break
    else
        log "❌ Download attempt $attempt failed"
        if [ $attempt -eq 3 ]; then
            log "❌ Trying GitHub fallback..."
            GITHUB_URL="https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/releases/latest/download/group-tree-visualizer-latest.zip"
            if curl -L --fail --connect-timeout 30 --max-time 180 "$GITHUB_URL" -o "$TEMP_DIR/release.zip" 2>&1; then
                log "✅ GitHub fallback successful"
                DOWNLOAD_SUCCESS=true
            fi
        fi
    fi
done

if [ "$DOWNLOAD_SUCCESS" = false ]; then
    log "❌ All download attempts failed"
    exit 1
fi

# Verify download
if [ ! -f "$TEMP_DIR/release.zip" ] || [ ! -s "$TEMP_DIR/release.zip" ]; then
    log "❌ Downloaded file is empty or missing"
    exit 1
fi

FILE_SIZE=$(ls -lh "$TEMP_DIR/release.zip" | awk '{print $5}')
log "📦 Package downloaded successfully ($FILE_SIZE)"

log "📂 Extracting package..."
if unzip -q "$TEMP_DIR/release.zip" -d "$TEMP_DIR/extracted" 2>/dev/null; then
    log "✅ Extraction successful"
else
    log "❌ Extraction failed"
    log "📋 File type: $(file "$TEMP_DIR/release.zip" 2>/dev/null || echo 'unknown')"
    exit 1
fi

# Find static files
log "🔍 Locating static files..."
STATIC_DIR="$TEMP_DIR/extracted"

if [ -f "$TEMP_DIR/extracted/index.html" ]; then
    log "📄 Found index.html in root directory"
elif [ -f "$TEMP_DIR/extracted/static/index.html" ]; then
    STATIC_DIR="$TEMP_DIR/extracted/static"
    log "📄 Found index.html in static subdirectory"
elif [ -f "$TEMP_DIR/extracted/group-tree-visualizer-latest/static/index.html" ]; then
    STATIC_DIR="$TEMP_DIR/extracted/group-tree-visualizer-latest/static"
    log "📄 Found index.html in nested static directory"
else
    log "❌ No index.html found in package"
    log "📋 Package contents:"
    find "$TEMP_DIR/extracted" -name "*.html" | head -10 || echo "No HTML files found"
    find "$TEMP_DIR/extracted" -type f | head -20 || echo "No files found"
    exit 1
fi

FILE_COUNT=$(find "$STATIC_DIR" -type f | wc -l)
log "📊 Found $FILE_COUNT files to deploy"

log "🔑 Retrieving deployment token..."
set +e
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list --name "$STATIC_WEB_APP_NAME" --resource-group "$RESOURCE_GROUP_NAME" --query "properties.apiKey" -o tsv 2>/dev/null)
TOKEN_RESULT=$?
set -e

if [ $TOKEN_RESULT -ne 0 ] || [ -z "$DEPLOYMENT_TOKEN" ] || [ "$DEPLOYMENT_TOKEN" = "null" ]; then
    log "❌ Failed to retrieve deployment token (exit code: $TOKEN_RESULT)"
    
    # Try alternative method
    log "🔄 Trying alternative token retrieval..."
    set +e
    DEPLOYMENT_TOKEN=$(az rest --method post --uri "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP_NAME/providers/Microsoft.Web/staticSites/$STATIC_WEB_APP_NAME/listSecrets?api-version=2022-03-01" --query "properties.apiKey" -o tsv 2>/dev/null)
    ALT_RESULT=$?
    set -e
    
    if [ $ALT_RESULT -ne 0 ] || [ -z "$DEPLOYMENT_TOKEN" ] || [ "$DEPLOYMENT_TOKEN" = "null" ]; then
        log "❌ Alternative token retrieval also failed (exit code: $ALT_RESULT)"
        exit 1
    else
        log "✅ Alternative token retrieval successful"
    fi
else
    log "✅ Token retrieved successfully"
fi

TOKEN_LENGTH=${#DEPLOYMENT_TOKEN}
log "📊 Token length: $TOKEN_LENGTH characters"

log "🚀 Deploying to Static Web App..."
log "📁 Source directory: $STATIC_DIR"
log "📊 Files to deploy: $FILE_COUNT"

set +e
DEPLOY_OUTPUT=$(az staticwebapp deploy \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --source "$STATIC_DIR" \
    --deployment-token "$DEPLOYMENT_TOKEN" \
    --verbose 2>&1)
DEPLOY_RESULT=$?
set -e

if [ $DEPLOY_RESULT -eq 0 ]; then
    log "✅ Deployment completed successfully!"
    log "🌐 Application URL: https://$STATIC_WEB_APP_NAME.azurestaticapps.net"
    log "📊 Deployment summary: $FILE_COUNT files deployed"
else
    log "❌ Deployment failed with exit code: $DEPLOY_RESULT"
    log "📋 Deployment output:"
    echo "$DEPLOY_OUTPUT"
    
    # Additional diagnostics
    log "🔍 Diagnostics:"
    log "  Token length: $TOKEN_LENGTH"
    log "  Source files: $(ls -la "$STATIC_DIR" | head -5 || echo 'Could not list files')"
    log "  SWA status: $(az staticwebapp show --name "$STATIC_WEB_APP_NAME" --resource-group "$RESOURCE_GROUP_NAME" --query 'properties.defaultHostname' -o tsv 2>/dev/null || echo 'Could not get status')"
    
    exit 1
fi

log "🧹 Cleaning up temporary files..."
rm -rf "$TEMP_DIR"

log "🎉 Bicep deployment completed successfully!"
log "📊 Final summary:"
log "  📦 Files deployed: $FILE_COUNT"
log "  📦 Package size: $FILE_SIZE"
log "  🌐 App URL: https://$STATIC_WEB_APP_NAME.azurestaticapps.net"
log "  🔧 Next step: Configure MSAL authentication"
'''
  }
}

// Outputs
output staticWebAppUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output staticWebAppName string = staticWebApp.name
output tenantId string = subscription().tenantId
output subscriptionId string = subscription().subscriptionId
output resourceGroupName string = resourceGroup().name
