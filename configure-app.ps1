# PowerShell script to configure Azure Static Web App with required environment variables and permissions
# Prerequisites: Azure CLI installed and logged in (az login)

Write-Host "Configuring Azure Static Web App for Group Tree Membership Visualizer..." -ForegroundColor Green

$STATIC_WEB_APP_NAME = "group-tree-membership-visualizer"
$APP_ID = "4c4814af-7b2a-4a96-bed9-59c394641f29"
$TENANT_ID = "df5c1b3a-b49f-406f-b067-a4a6fae72629"

Write-Host "Step 1: Setting environment variables..." -ForegroundColor Yellow

# Set the Client ID
Write-Host "Setting AZURE_CLIENT_ID..." -ForegroundColor Cyan
az staticwebapp appsettings set --name $STATIC_WEB_APP_NAME --setting-names "AZURE_CLIENT_ID=$APP_ID"

# Set the Tenant ID
Write-Host "Setting AZURE_TENANT_ID..." -ForegroundColor Cyan
az staticwebapp appsettings set --name $STATIC_WEB_APP_NAME --setting-names "AZURE_TENANT_ID=$TENANT_ID"

# Get or create a new client secret
Write-Host "Creating new client secret..." -ForegroundColor Cyan
$CLIENT_SECRET = az ad app credential reset --id $APP_ID --append --display-name "Static Web App API Secret" --query password -o tsv

# Set the Client Secret
Write-Host "Setting AZURE_CLIENT_SECRET..." -ForegroundColor Cyan
az staticwebapp appsettings set --name $STATIC_WEB_APP_NAME --setting-names "AZURE_CLIENT_SECRET=$CLIENT_SECRET"

Write-Host "Step 2: Adding Application permissions..." -ForegroundColor Yellow

# Add Application permissions (these are needed for server-to-server calls)
Write-Host "Adding User.Read.All (Application)..." -ForegroundColor Cyan
az ad app permission add --id $APP_ID --api 00000003-0000-0000-c000-000000000000 --api-permissions "df021288-bdef-4463-88db-98f22de89214=Role"

Write-Host "Adding Group.Read.All (Application)..." -ForegroundColor Cyan
az ad app permission add --id $APP_ID --api 00000003-0000-0000-c000-000000000000 --api-permissions "5b567255-7703-4780-807c-7be8301ae99b=Role"

Write-Host "Adding Directory.Read.All (Application)..." -ForegroundColor Cyan
az ad app permission add --id $APP_ID --api 00000003-0000-0000-c000-000000000000 --api-permissions "7ab1d382-f21e-4acd-a863-ba3e13f7da61=Role"

Write-Host "Adding GroupMember.Read.All (Application)..." -ForegroundColor Cyan
az ad app permission add --id $APP_ID --api 00000003-0000-0000-c000-000000000000 --api-permissions "98830695-27a2-44f7-8c18-0c3ebc9698f6=Role"

Write-Host "Step 3: Attempting to grant admin consent..." -ForegroundColor Yellow
try {
    az ad app permission admin-consent --id $APP_ID
    Write-Host "✅ Admin consent granted successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Admin consent failed - please grant consent manually in Azure Portal" -ForegroundColor Red
}

Write-Host ""
Write-Host "Configuration Summary:" -ForegroundColor Cyan
Write-Host "========================"
Write-Host "Static Web App: $STATIC_WEB_APP_NAME"
Write-Host "App ID: $APP_ID"
Write-Host "Tenant ID: $TENANT_ID"
Write-Host "New Client Secret: [HIDDEN]"
Write-Host ""
Write-Host "Environment Variables Set:" -ForegroundColor Green
Write-Host "✅ AZURE_CLIENT_ID"
Write-Host "✅ AZURE_CLIENT_SECRET"
Write-Host "✅ AZURE_TENANT_ID"
Write-Host ""
Write-Host "Application Permissions Added:" -ForegroundColor Green
Write-Host "✅ User.Read.All (Application)"
Write-Host "✅ Group.Read.All (Application)"
Write-Host "✅ Directory.Read.All (Application)"
Write-Host "✅ GroupMember.Read.All (Application)"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. If admin consent failed above, go to Azure Portal:"
Write-Host "   Azure Active Directory -> App registrations -> Group Tree Membership Visualizer"
Write-Host "   -> API permissions -> Grant admin consent for MSCloudNinja"
Write-Host ""
Write-Host "2. Wait a few minutes for the settings to propagate"
Write-Host ""
Write-Host "3. Test the application at: https://$STATIC_WEB_APP_NAME.azurestaticapps.net"
Write-Host ""
Write-Host "4. Test the debug endpoint: https://$STATIC_WEB_APP_NAME.azurestaticapps.net/api/debug"
