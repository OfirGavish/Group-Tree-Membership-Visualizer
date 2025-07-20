#!/bin/bash

# Script to create Azure AD App Registration for Group Tree Membership Visualizer
# Prerequisites: Azure CLI installed and logged in

echo "🚀 Creating Azure AD App Registration for Group Tree Membership Visualizer..."

# Get your Static Web App URL
echo "📋 Please provide your Azure Static Web App URL (e.g., https://brave-smoke-0cd316503.azurestaticapps.net):"
read STATIC_WEB_APP_URL

# Create the app registration
echo "📝 Creating app registration..."
APP_ID=$(az ad app create \
    --display-name "Group Tree Membership Visualizer" \
    --web-redirect-uris "${STATIC_WEB_APP_URL}/.auth/login/aad/callback" \
    --query appId -o tsv)

echo "✅ App registration created with Client ID: $APP_ID"

# Create a client secret
echo "🔐 Creating client secret..."
CLIENT_SECRET=$(az ad app credential reset \
    --id $APP_ID \
    --append \
    --display-name "Static Web App Secret" \
    --query password -o tsv)

echo "✅ Client secret created"

# Configure API permissions
echo "🔑 Configuring Microsoft Graph API permissions..."

# Add Microsoft Graph permissions
az ad app permission add --id $APP_ID --api 00000003-0000-0000-c000-000000000000 --api-permissions \
    e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope \
    62a82d76-70ea-41e2-9197-370581804d09=Scope \
    06da0dbc-49e2-44d2-8312-53f166ab848a=Scope \
    bc024368-1153-4739-b217-4326f2e966d0=Scope

echo "✅ API permissions configured"

# Grant admin consent (requires admin privileges)
echo "🔐 Attempting to grant admin consent..."
az ad app permission admin-consent --id $APP_ID || echo "⚠️  Admin consent failed - you may need to grant consent manually in Azure Portal"

echo ""
echo "🎉 App registration complete!"
echo ""
echo "📋 Configuration Summary:"
echo "========================"
echo "App Name: Group Tree Membership Visualizer"
echo "Client ID: $APP_ID"
echo "Client Secret: $CLIENT_SECRET"
echo "Redirect URI: ${STATIC_WEB_APP_URL}/.auth/login/aad/callback"
echo ""
echo "📝 Next Steps:"
echo "1. Go to your Azure Static Web App in the portal"
echo "2. Navigate to Configuration"
echo "3. Add these application settings:"
echo "   - AZURE_CLIENT_ID = $APP_ID"
echo "   - AZURE_CLIENT_SECRET = $CLIENT_SECRET"
echo "4. Save and restart your Static Web App"
echo ""
echo "🌐 API Permissions Configured:"
echo "   - User.Read (Sign in and read user profile)"
echo "   - Group.Read.All (Read all groups)"
echo "   - Directory.Read.All (Read directory data)"
echo "   - GroupMember.Read.All (Read group memberships)"
echo ""
echo "⚠️  Important: If admin consent failed, go to Azure Portal > App registrations > Group Tree Membership Visualizer > API permissions > Grant admin consent"
