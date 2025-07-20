# Simplified Azure Static Web Apps Authentication

## How it works (No Azure Functions needed!)

1. **Azure Static Web Apps handles authentication** - No custom app registration required
2. **Client gets user info** from `/.auth/me` endpoint  
3. **Use Microsoft Graph SDK** with the authenticated user's token
4. **Deploy as static site** with built-in auth enabled

## Setup Process

### 1. Deploy to Azure Static Web Apps
```bash
# Build the app
npm run build

# Deploy using VS Code Azure Static Web Apps extension
# OR use Azure CLI
```

### 2. Enable Built-in Authentication
- In Azure Portal → Your Static Web App → Authentication
- Add Identity Provider → Microsoft
- Azure automatically creates the app registration
- No manual configuration needed!

### 3. Configure Authentication Settings
```json
{
  "auth": {
    "identityProviders": {
      "azureActiveDirectory": {
        "userDetailsClaim": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
        "registration": {
          "openIdIssuer": "https://login.microsoftonline.com/common/v2.0",
          "clientIdSettingName": "AZURE_CLIENT_ID",
          "clientSecretSettingName": "AZURE_CLIENT_SECRET"
        }
      }
    }
  },
  "routes": [
    {
      "route": "/.auth/login/aad",
      "allowedRoles": ["anonymous"]
    },
    {
      "route": "/*",
      "allowedRoles": ["authenticated"]
    }
  ]
}
```

## Benefits
- ✅ No custom app registration needed
- ✅ No server-side code required  
- ✅ Automatic HTTPS and CDN
- ✅ Free tier available
- ✅ Enterprise security
- ✅ Simple deployment
