# 📚 Setup Guide

This guide will walk you through setting up the Group Tree Membership Visualizer with MSAL authentication after deployment.

## 🎯 Overview

The setup process involves:
1. Deploying the application to Azure
2. Configuring MSAL app registration (Single Page Application)
3. Setting up delegated permissions (no client secrets required)
4. Testing the application
5. Optional customization

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

## ⚙️ Step 2: Configure MSAL App Registration

After deployment, you need to configure the Microsoft Graph API permissions for MSAL authentication.

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

### 🔧 Run MSAL Configuration Script

1. Download the configuration script:
```powershell
# Download the updated script for MSAL
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/OfirGavish/Group-Tree-Membership-Visualizer/main/configure-app.ps1" -OutFile "configure-app.ps1"
```

2. Run the script with your Static Web App name:
```powershell
# Execute the script (requires admin permissions for consent)
.\configure-app.ps1 -StaticWebAppName "your-static-web-app-name"
```

The script will automatically:
- ✅ Create a **Single-tenant SPA** app registration
- ✅ Configure **PKCE authentication** (no client secrets)
- ✅ Set up proper **redirect URIs** for your domain
- ✅ Configure **delegated permissions only**
- ✅ Set **MSAL environment variables**
- ✅ Request **admin consent** for Graph API permissions
- ✅ Test the configuration

**What the script creates:**
- **App Registration**: Single Page Application with PKCE
- **Platform**: SPA platform with proper redirect URIs
- **Permissions**: Delegated permissions for Microsoft Graph
- **Environment Variables**: `NEXT_PUBLIC_AZURE_CLIENT_ID` and `AZURE_TENANT_ID`

## 🔐 Step 3: Grant Admin Consent

If admin consent wasn't granted automatically:

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Find "Group Tree Membership Visualizer"
4. Go to **API permissions**
5. Click **Grant admin consent for [Your Organization]**
6. Confirm the consent

### Required Delegated Permissions

Verify these **delegated permissions** are present (MSAL uses delegated permissions only):

| Permission | Type | Status |
|------------|------|--------|
| User.Read | Delegated | ✅ Auto-granted |
| User.Read.All | Delegated | ✅ Requires admin consent |
| Group.Read.All | Delegated | ✅ Requires admin consent |
| Directory.Read.All | Delegated | ✅ Requires admin consent |
| Device.Read.All | Delegated | ✅ Requires admin consent |

**Important**: MSAL uses **delegated permissions only** - users will see only data they already have access to.

## 🧪 Step 4: Test Your Application

### Test MSAL Authentication
1. Open your app URL: `https://your-app-name.azurestaticapps.net`
2. You should see the application interface
3. If not authenticated, you'll see a "Sign In" button
4. Click "Sign In" to trigger MSAL popup authentication
5. Authenticate with your work account
6. You should see the main application interface

### Test API Endpoints
Visit the debug endpoint to verify API access:
```
https://your-app-name.azurestaticapps.net/api/debug
```

Expected response:
```json
{
  "authenticated": true,
  "authMethod": "MSAL Bearer Token",
  "user": {
    "displayName": "Your Name",
    "mail": "your.email@domain.com"
  },
  "permissions": ["User.Read", "User.Read.All", "Group.Read.All", ...],
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

#### 1. MSAL Authentication Fails
- ✅ Verify app registration is configured as **Single Page Application (SPA)**
- ✅ Check redirect URIs include your Static Web App domain
- ✅ Ensure admin consent was granted for delegated permissions
- ✅ Verify user account exists in the tenant

#### 2. API Returns 401 Unauthorized
- ✅ Check MSAL token is being passed to API calls
- ✅ Verify Bearer token format in Authorization header
- ✅ Ensure user has appropriate directory permissions
- ✅ Test token acquisition in browser console

#### 3. No Users/Groups Visible
- ✅ Check user has directory read permissions in your organization
- ✅ Verify delegated permissions are granted (not application permissions)
- ✅ Ensure user can access Microsoft Graph data through other apps
- ✅ Test with different user account (admin vs regular user)

#### 4. MSAL Token Issues
- ✅ Clear browser localStorage/sessionStorage
- ✅ Check browser console for MSAL errors
- ✅ Verify `NEXT_PUBLIC_AZURE_CLIENT_ID` environment variable
- ✅ Ensure app registration client ID matches environment variable

### Debug Steps

1. **Check Environment Variables**:
```powershell
# List Static Web App settings
az staticwebapp appsettings list --name "your-app-name"

# Should show:
# NEXT_PUBLIC_AZURE_CLIENT_ID: your-client-id
# AZURE_TENANT_ID: your-tenant-id
```

2. **Test MSAL Authentication**:
```javascript
// Open browser console on your app
// Check MSAL instance
console.log(window.msal?.getAllAccounts());

// Check token acquisition
window.msal?.acquireTokenSilent({
  scopes: ['User.Read'],
  account: window.msal.getAllAccounts()[0]
}).then(response => console.log(response.accessToken));
```

3. **Test API with Bearer Token**:
```bash
# Get token from browser console first, then:
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     https://your-app-name.azurestaticapps.net/api/debug
```

4. **Check App Registration**:
   - Platform: Single Page Application ✅
   - Redirect URIs: Include your domain ✅
   - Delegated permissions: Granted ✅
   - No client secrets: PKCE only ✅

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
- ✅ A fully functional group membership visualizer with **MSAL authentication**
- ✅ **Single Page Application** with PKCE security (no client secrets)
- ✅ **Delegated permissions** that respect user's existing access
- ✅ Beautiful tree visualizations of your organization
- ✅ User, group, and device search capabilities
- ✅ Real-time data from Microsoft Graph API
- ✅ Secure **client-side authentication** for your users

**Key Benefits of Your MSAL Setup:**
- 🔐 **Enhanced Security**: PKCE authentication without client secrets
- 👥 **User-based Access**: Users see only what they're permitted to see
- ⚡ **Better Performance**: Direct client-side token acquisition
- 🛠️ **Easier Maintenance**: No client secret rotation required
- 🏢 **Organizational Security**: Single-tenant restriction

Enjoy exploring your organization's structure! 🌳
