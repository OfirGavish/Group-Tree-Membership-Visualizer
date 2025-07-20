# PowerShell script to create Azure AD App Registration for Group Tree Membership Visualizer
# Prerequisites: Azure CLI installed and logged in (az login)

Write-Host "🚀 Creating Azure AD App Registration for Group Tree Membership Visualizer..." -ForegroundColor Green

# Get your Static Web App URL
$STATIC_WEB_APP_URL = Read-Host "📋 Please provide your Azure Static Web App URL (e.g., https://brave-smoke-0cd316503.azurestaticapps.net)"

# Create the app registration
Write-Host "📝 Creating app registration..." -ForegroundColor Yellow
$APP_ID = az ad app create `
    --display-name "Group Tree Membership Visualizer" `
    --web-redirect-uris "$STATIC_WEB_APP_URL/.auth/login/aad/callback" `
    --query appId -o tsv

Write-Host "✅ App registration created with Client ID: $APP_ID" -ForegroundColor Green

# Create a client secret
Write-Host "🔐 Creating client secret..." -ForegroundColor Yellow
$CLIENT_SECRET = az ad app credential reset `
    --id $APP_ID `
    --append `
    --display-name "Static Web App Secret" `
    --query password -o tsv

Write-Host "✅ Client secret created" -ForegroundColor Green

# Configure API permissions
Write-Host "🔑 Configuring Microsoft Graph API permissions..." -ForegroundColor Yellow

# Add Microsoft Graph permissions
az ad app permission add --id $APP_ID --api 00000003-0000-0000-c000-000000000000 --api-permissions `
    e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope `
    62a82d76-70ea-41e2-9197-370581804d09=Scope `
    06da0dbc-49e2-44d2-8312-53f166ab848a=Scope `
    bc024368-1153-4739-b217-4326f2e966d0=Scope

Write-Host "✅ API permissions configured" -ForegroundColor Green

# Grant admin consent (requires admin privileges)
Write-Host "🔐 Attempting to grant admin consent..." -ForegroundColor Yellow
try {
    az ad app permission admin-consent --id $APP_ID
    Write-Host "✅ Admin consent granted" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Admin consent failed - you may need to grant consent manually in Azure Portal" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 App registration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Configuration Summary:" -ForegroundColor Cyan
Write-Host "========================"
Write-Host "App Name: Group Tree Membership Visualizer"
Write-Host "Client ID: $APP_ID"
Write-Host "Client Secret: $CLIENT_SECRET"
Write-Host "Redirect URI: $STATIC_WEB_APP_URL/.auth/login/aad/callback"
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Go to your Azure Static Web App in the portal"
Write-Host "2. Navigate to Configuration"
Write-Host "3. Add these application settings:"
Write-Host "   - AZURE_CLIENT_ID = $APP_ID"
Write-Host "   - AZURE_CLIENT_SECRET = $CLIENT_SECRET"
Write-Host "4. Save and restart your Static Web App"
Write-Host ""
Write-Host "🌐 API Permissions Configured:" -ForegroundColor Cyan
Write-Host "   - User.Read (Sign in and read user profile)"
Write-Host "   - Group.Read.All (Read all groups)"
Write-Host "   - Directory.Read.All (Read directory data)"
Write-Host "   - GroupMember.Read.All (Read group memberships)"
Write-Host ""
Write-Host "⚠️  Important: If admin consent failed, go to Azure Portal > App registrations > Group Tree Membership Visualizer > API permissions > Grant admin consent" -ForegroundColor Red
