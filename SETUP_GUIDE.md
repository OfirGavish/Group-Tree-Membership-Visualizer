# 📚 Setup Guide

This guide will walk you through setting up the Group Tree Membership Visualizer after deployment.

## 🎯 Overview

The setup process involves:
1. Deploying the application to Azure
2. Configuring app registration and permissions
3. Testing the application
4. Optional customization

## 🚀 Step 1: Deploy to Azure

### Option A: One-Click Deployment (Recommended)

1. Click the "Deploy to Azure" button in the README
2. Fill in the deployment parameters:
   - **Subscription**: Your Azure subscription
   - **Resource Group**: Create new or use existing
   - **Region**: Choose a region close to your users
   - **Static Web App Name**: Choose a unique name
   - **Repository URL**: Use the default GitHub URL
   - **Branch**: `main`

3. Click "Review + Create" then "Create"
4. Wait for deployment to complete (5-10 minutes)

### Option B: Manual Azure CLI Deployment

```bash
# Login to Azure
az login

# Create resource group
az group create --name "rg-group-visualizer" --location "East US"

# Deploy the template
az deployment group create \
  --resource-group "rg-group-visualizer" \
  --template-file azuredeploy.json \
  --parameters staticWebAppName="your-app-name"
```

## ⚙️ Step 2: Configure App Registration

After deployment, you need to configure the Microsoft Graph API permissions.

### 🔍 Find Your App Details

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Resource Group
3. Find your Static Web App
4. Note the **URL** (e.g., `https://your-app-name.azurestaticapps.net`)

### 📋 Get Required Information

You'll need:
- **Static Web App Name**: From Azure Portal
- **App Registration ID**: Will be created during configuration
- **Tenant ID**: Your organization's Entra ID tenant ID

To find your Tenant ID:
```powershell
# Using Azure CLI
az account show --query tenantId -o tsv

# Using PowerShell
(Get-AzContext).Tenant.Id
```

### 🔧 Run Configuration Script

1. Download the configuration script:
```powershell
# Download the script
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/OfirGavish/Group-Tree-Membership-Visualizer/main/configure-app.ps1" -OutFile "configure-app.ps1"
```

2. Edit the script variables:
```powershell
# Open the script and update these values:
$STATIC_WEB_APP_NAME = "your-static-web-app-name"
$TENANT_ID = "your-tenant-id"
```

3. Run the script:
```powershell
# Execute as administrator
.\configure-app.ps1
```

The script will:
- ✅ Create an app registration
- ✅ Set environment variables
- ✅ Configure Graph API permissions
- ✅ Attempt admin consent
- ✅ Test the configuration

## 🔐 Step 3: Grant Admin Consent

If admin consent wasn't granted automatically:

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Find "Group Tree Membership Visualizer"
4. Go to **API permissions**
5. Click **Grant admin consent for [Your Organization]**
6. Confirm the consent

### Required Permissions

Verify these permissions are present:

| Permission | Type | Status |
|------------|------|--------|
| User.Read.All | Application | ✅ Granted |
| Group.Read.All | Application | ✅ Granted |
| Directory.Read.All | Application | ✅ Granted |
| GroupMember.Read.All | Application | ✅ Granted |

## 🧪 Step 4: Test Your Application

### Test Authentication
1. Open your app URL: `https://your-app-name.azurestaticapps.net`
2. You should see a sign-in page
3. Click "Sign in with Microsoft"
4. Authenticate with your work account

### Test API Endpoints
Visit the debug endpoint to verify API access:
```
https://your-app-name.azurestaticapps.net/api/debug
```

Expected response:
```json
{
  "authenticated": true,
  "user": {
    "displayName": "Your Name",
    "mail": "your.email@domain.com"
  },
  "permissions": ["User.Read.All", "Group.Read.All", ...],
  "status": "success"
}
```

### Test User Search
1. Try searching for a user in your organization
2. Select a user from the dropdown
3. Verify the tree visualization loads

### Test Group Search
1. Toggle to "Groups" mode
2. Search for a group
3. Verify group members are displayed
4. Check that empty groups are highlighted in red

## 🎨 Step 5: Customization (Optional)

### Branding
To customize the application branding:

1. Update `src/app/simple-page.tsx`:
```tsx
// Change the header title
<h1 className="text-xl font-bold text-white">
  Your Organization - Group Visualizer
</h1>
```

2. Update `src/app/layout.tsx`:
```tsx
export const metadata: Metadata = {
  title: 'Your Organization - Group Visualizer',
  description: 'Custom description for your organization',
}
```

### Color Scheme
Modify `src/app/globals.css` to change colors:
```css
/* Change gradient colors */
html, body {
  background: linear-gradient(135deg, #your-color 0%, #your-color 50%, #your-color 100%);
}
```

### Logo
Add your organization logo:
1. Place logo file in `public/logo.png`
2. Update the header in `simple-page.tsx`:
```tsx
<div className="flex items-center gap-3">
  <img src="/logo.png" alt="Logo" className="h-8 w-8" />
  <h1 className="text-xl font-bold text-white">Your Org</h1>
</div>
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Authentication Fails
- ✅ Verify app registration exists
- ✅ Check admin consent was granted
- ✅ Ensure user has appropriate permissions

#### 2. API Returns 403 Forbidden
- ✅ Verify Graph API permissions are granted
- ✅ Check admin consent status
- ✅ Ensure app secret is configured

#### 3. No Users/Groups Visible
- ✅ Check user has directory read permissions
- ✅ Verify organization allows app access
- ✅ Test with different user account

#### 4. Empty Groups Not Highlighted
- ✅ Verify the user has Group.Read.All permission
- ✅ Check that getGroups API is working
- ✅ Test the API endpoint directly

### Debug Steps

1. **Check Environment Variables**:
```powershell
# List Static Web App settings
az staticwebapp appsettings list --name "your-app-name"
```

2. **Test API Directly**:
```bash
# Test the debug endpoint
curl https://your-app-name.azurestaticapps.net/api/debug
```

3. **Check App Registration**:
   - Verify redirect URIs include your Static Web App URL
   - Ensure API permissions are granted
   - Check client secret is not expired

### Get Help

If you're still having issues:
1. Check the [Troubleshooting Guide](TROUBLESHOOTING.md)
2. Review Azure Static Web Apps logs
3. Open an issue on GitHub with:
   - Error messages
   - Configuration details
   - Steps to reproduce

## 🎉 Success!

Once everything is working, you should have:
- ✅ A fully functional group membership visualizer
- ✅ Beautiful tree visualizations of your organization
- ✅ User and group search capabilities
- ✅ Real-time data from Microsoft Graph
- ✅ Secure authentication for your users

Enjoy exploring your organization's structure! 🌳
