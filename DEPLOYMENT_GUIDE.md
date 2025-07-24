# Azure Static Web Apps Deployment Guide

This guide provides multiple deployment options for the Group Tree Membership Visualizer that don't require users to fork the repository or manage GitHub connections.

## Prerequisites

Before deploying, ensure you have:

1. **Node.js** (version 18 or later) - [Download here](https://nodejs.org/)
2. **Azure CLI** - [Installation guide](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
3. **Azure subscription** with permissions to create resources

## Deployment Options

### Option 1: Deploy to Azure Button (Easiest for End Users)

Perfect for users who want a simple one-click deployment experience:

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FOfirGavish%2FGroup-Tree-Membership-Visualizer%2Fmain%2Fazuredeploy.json)

#### How it works:
1. **Click the Deploy to Azure button** above
2. **Fill in the parameters:**
   - **Static Web App Name**: Choose a unique name (e.g., "mycompany-group-visualizer")
   - **Repository URL**: Use default (points to this repository)
   - **Repository Branch**: Use "main" for stable release
   - **Location**: Choose your preferred Azure region
3. **Click "Review + Create"** then **"Create"**
4. **Wait for deployment** (usually 2-3 minutes)
5. **Configure Azure AD** using the provided script (see below)

#### After ARM template deployment:
```powershell
# Download and run the configuration script
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/OfirGavish/Group-Tree-Membership-Visualizer/main/configure-app.ps1" -OutFile "configure-app.ps1"
.\configure-app.ps1 -StaticWebAppName "your-app-name"
```

### Option 2: Direct Deployment Script (For Advanced Users)

This method builds and deploys the application directly to Azure Static Web Apps without any GitHub integration.

#### Steps:

1. **Download the source code:**
   ```powershell
   # Download and extract the latest release
   Invoke-WebRequest -Uri "https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/archive/refs/heads/main.zip" -OutFile "visualizer.zip"
   Expand-Archive -Path "visualizer.zip" -DestinationPath "."
   cd "Group-Tree-Membership-Visualizer-main"
   ```

2. **Run the deployment script:**
   ```powershell
   .\deploy-to-azure.ps1 -StaticWebAppName "MyGroupVisualizer" -Location "East US 2"
   ```

3. **Configure Azure AD integration:**
   ```powershell
   .\configure-app.ps1 -StaticWebAppName "MyGroupVisualizer"
   ```

#### What this script does:
- Checks prerequisites (Node.js, Azure CLI)
- Installs required Azure CLI extensions
- Builds the Next.js application
- Creates Azure Static Web App
- Deploys the built application directly

If you prefer manual control over each step:

#### 1. Build the application locally:
```bash
# Install dependencies
npm install

# Build and export the application
npm run build
npm run export
```

#### 2. Create Azure Static Web App:
```bash
# Sign in to Azure
az login

# Create resource group
az group create --name "group-visualizer-rg" --location "East US 2"

# Create Static Web App
az staticwebapp create \
  --name "MyGroupVisualizer" \
  --resource-group "group-visualizer-rg" \
  --location "East US 2" \
  --source "." \
  --branch "main" \
  --app-location "/" \
  --output-location "out" \
  --login-with-github false
```

#### 3. Deploy using SWA CLI:
```bash
# Install SWA CLI
npm install -g @azure/static-web-apps-cli

# Get deployment token
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list --name "MyGroupVisualizer" --resource-group "group-visualizer-rg" --query "properties.apiKey" --output tsv)

# Deploy
swa deploy --deployment-token $DEPLOYMENT_TOKEN --app-location "." --output-location "out" --api-location "api"
```

### Option 3: ARM Template Deployment

For enterprise environments, use the ARM template:

#### 1. Deploy infrastructure:
```bash
az deployment group create \
  --resource-group "group-visualizer-rg" \
  --template-file "azuredeploy.json" \
  --parameters @azuredeploy.parameters.json \
  --parameters staticWebAppName="MyGroupVisualizer"
```

#### 2. Deploy application code:
Use the built application from Option 1 or 2 above.

## Post-Deployment Configuration

After deployment, you **must** configure Azure AD integration:

1. **Run the configuration script:**
   ```powershell
   .\configure-app.ps1 -StaticWebAppName "MyGroupVisualizer"
   ```

2. **This script will:**
   - Create or find Azure AD app registration
   - Generate client secrets
   - Configure Microsoft Graph permissions
   - Set environment variables in Static Web App
   - Open browser for admin consent

## Distribution Package

To create a distribution package for others:

### 1. Create deployment package:
```powershell
# Build the application
npm run build
npm run export

# Create distribution package
$packageName = "group-visualizer-deployment-$(Get-Date -Format 'yyyy-MM-dd')"
New-Item -ItemType Directory -Path $packageName
Copy-Item -Path "out/*" -Destination "$packageName/" -Recurse
Copy-Item -Path "api" -Destination "$packageName/" -Recurse
Copy-Item -Path "deploy-to-azure.ps1" -Destination "$packageName/"
Copy-Item -Path "configure-app.ps1" -Destination "$packageName/"
Copy-Item -Path "package.json" -Destination "$packageName/"
Copy-Item -Path "README.md" -Destination "$packageName/"

# Create zip package
Compress-Archive -Path "$packageName/*" -DestinationPath "$packageName.zip"
```

### 2. Distribution instructions:
Users only need to:
1. Extract the deployment package
2. Run `.\deploy-to-azure.ps1 -StaticWebAppName "TheirAppName"`
3. Run `.\configure-app.ps1 -StaticWebAppName "TheirAppName"`

## Environment Variables

The application requires these environment variables (automatically set by the configuration script):

- `AZURE_CLIENT_ID` - Azure AD app registration client ID
- `AZURE_CLIENT_SECRET` - Azure AD app registration client secret
- `AZURE_TENANT_ID` - Azure AD tenant ID

## Security Considerations

1. **Client secrets** are automatically generated with 24-month expiration
2. **Minimal permissions** are requested (read-only access to users, groups, and directory)
3. **Admin consent** may be required for organization-wide permissions
4. **Environment variables** are securely stored in Azure Static Web Apps configuration

## Troubleshooting

### Common Issues:

1. **Build failures**: Ensure Node.js version 18+ is installed
2. **Deployment failures**: Check Azure CLI version and authentication
3. **Permission errors**: Ensure Azure account has contributor access to subscription
4. **Graph API errors**: Verify admin consent has been granted

### Getting Help:

- Check the [Troubleshooting Guide](TROUBLESHOOTING.md)
- Review Azure Static Web Apps logs in Azure Portal
- Verify Azure AD app registration in Azure Portal

## Clean Up

To remove all resources:

```bash
# Delete the entire resource group
az group delete --name "group-visualizer-rg" --yes --no-wait

# Remove Azure AD app registration (optional)
az ad app delete --id "your-app-id"
```

## Next Steps

After successful deployment:

1. Visit your Static Web App URL
2. Sign in with your Azure AD account
3. Test searching for users and viewing group memberships
4. Review the application documentation for advanced configuration
