# Standalone Deployment Guide

This guide explains how to deploy the Group Tree Membership Visualizer without requiring GitHub authorization, making it perfect for organizational and public distribution.

## Overview

The standalone deployment method creates Azure Static Web App infrastructure and then deploys pre-built static files directly, bypassing the need for GitHub integration and authorization.

## Deployment Process

### Step 1: Deploy Infrastructure

Use the standalone ARM template that creates the Static Web App without GitHub dependency:

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FOfirGavish%2FGroup-Tree-Membership-Visualizer%2Fmain%2Fazuredeploy-standalone.json)

**Parameters:**
- **Static Web App Name**: Choose a globally unique name
- **Location**: Select region closest to your users
- **Pricing Tier**: Free (up to 100 requests/day) or Standard (production)
- **Tags**: Organizational tags for resource management

**Important**: After deployment, copy the **Deployment Token** from the ARM template outputs. You'll need this for Step 2.

### Step 2: Deploy Application Files

Two options for deploying the actual application:

#### Option A: Automated Script (Recommended)

```powershell
# Download the deployment script
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/OfirGavish/Group-Tree-Membership-Visualizer/main/deploy-standalone.ps1" -OutFile "deploy-standalone.ps1"

# Deploy application (replace with your actual values)
.\deploy-standalone.ps1 -StaticWebAppName "your-app-name" -DeploymentToken "your-deployment-token-from-step1"
```

#### Option B: Manual Azure CLI Deployment

```bash
# Download and extract the latest release
curl -L "https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/releases/latest/download/group-tree-visualizer-standalone.zip" -o app.zip
unzip app.zip

# Deploy using Azure CLI
az staticwebapp deploy --source "./group-tree-visualizer-standalone/static" --deployment-token "your-deployment-token"
```

### Step 3: Configure MSAL Authentication

```powershell
# Download configuration script
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/OfirGavish/Group-Tree-Membership-Visualizer/main/configure-app.ps1" -OutFile "configure-app.ps1"

# Run configuration
.\configure-app.ps1 -StaticWebAppName "your-app-name"
```

### Step 4: Grant Admin Consent

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Find "Group Tree Membership Visualizer"
4. Go to **API permissions** > **Grant admin consent for [Your Organization]**

## Advantages of Standalone Deployment

### ✅ For Organizations
- **No GitHub Account Required**: IT administrators don't need GitHub access
- **Security**: No external repository dependencies
- **Control**: Complete control over deployment timing and process
- **Compliance**: Easier to meet organizational deployment requirements

### ✅ For Public Distribution
- **No Authorization Barriers**: Anyone can deploy without GitHub permissions
- **Simplified Process**: Fewer steps for end users
- **Reliable**: No dependency on GitHub service availability during deployment

### ✅ For Maintenance
- **Predictable**: Same application version for all deployments
- **Testable**: Pre-built packages can be tested before distribution
- **Scalable**: Deploy to multiple environments easily

## Architecture Comparison

### GitHub-Integrated Deployment
```
Azure Portal → GitHub Auth → Static Web App → GitHub Actions → Deployment
```
**Issues**: Requires GitHub authorization, not suitable for public distribution

### Standalone Deployment
```
Azure Portal → Static Web App → Direct File Upload → Deployment
```
**Benefits**: No external dependencies, works for anyone

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Deployment token not working | Verify token from ARM template outputs |
| Files not updating | Clear browser cache and check deployment status |
| MSAL configuration fails | Ensure you have sufficient Azure AD permissions |
| App shows default page | Verify files were deployed to correct location |

### Getting the Deployment Token

**From ARM Template Output:**
The deployment token is provided in the ARM template outputs after infrastructure deployment.

**From Azure Portal:**
1. Go to your Static Web App resource
2. Navigate to **Overview** → **Manage deployment token**
3. Copy the token value

**From Azure CLI:**
```bash
az staticwebapp secrets list --name "your-app-name" --query "properties.apiKey" -o tsv
```

### Verifying Deployment

1. **Check Application URL**: Visit `https://your-app-name.azurestaticapps.net`
2. **Verify API Functions**: Check that `/api/health` returns a 200 response
3. **Test Authentication**: Ensure MSAL login works correctly
4. **Check Console**: Look for any JavaScript errors in browser console

## Deployment Automation

For organizations wanting to automate deployments:

### PowerShell Script Example
```powershell
# Automated deployment script for IT departments
param(
    [string]$AppName,
    [string]$ResourceGroup = "rg-group-visualizer",
    [string]$Location = "East US 2"
)

# Deploy infrastructure
$deployment = az deployment group create `
    --resource-group $ResourceGroup `
    --template-uri "https://raw.githubusercontent.com/OfirGavish/Group-Tree-Membership-Visualizer/main/azuredeploy-standalone.json" `
    --parameters staticWebAppName=$AppName location=$Location `
    --query "properties.outputs.deploymentToken.value" -o tsv

# Deploy application
.\deploy-standalone.ps1 -StaticWebAppName $AppName -DeploymentToken $deployment

# Configure MSAL
.\configure-app.ps1 -StaticWebAppName $AppName
```

### Azure DevOps Pipeline
```yaml
trigger: none # Manual deployment only

variables:
  staticWebAppName: 'group-tree-visualizer-prod'
  resourceGroup: 'rg-group-visualizer'

stages:
- stage: Deploy
  jobs:
  - job: DeployInfrastructure
    steps:
    - task: AzureResourceManagerTemplateDeployment@3
      inputs:
        deploymentScope: 'Resource Group'
        azureResourceManagerConnection: 'Azure Service Connection'
        resourceGroupName: '$(resourceGroup)'
        location: 'East US 2'
        templateLocation: 'URL of the file'
        csmFileLink: 'https://raw.githubusercontent.com/OfirGavish/Group-Tree-Membership-Visualizer/main/azuredeploy-standalone.json'
        csmParametersFileLink: 'https://raw.githubusercontent.com/OfirGavish/Group-Tree-Membership-Visualizer/main/azuredeploy-standalone.parameters.json'
        overrideParameters: '-staticWebAppName $(staticWebAppName)'
        deploymentOutputs: 'armOutputs'
    
    - task: PowerShell@2
      inputs:
        targetType: 'inline'
        script: |
          $outputs = ConvertFrom-Json '$(armOutputs)'
          $deploymentToken = $outputs.deploymentToken.value
          
          # Download and run deployment script
          Invoke-WebRequest -Uri "https://raw.githubusercontent.com/OfirGavish/Group-Tree-Membership-Visualizer/main/deploy-standalone.ps1" -OutFile "deploy-standalone.ps1"
          .\deploy-standalone.ps1 -StaticWebAppName "$(staticWebAppName)" -DeploymentToken $deploymentToken
```

## Best Practices

### Security
- **Protect Deployment Tokens**: Store securely, rotate regularly
- **Use HTTPS**: Always use HTTPS URLs for production
- **Monitor Access**: Review app registration permissions regularly

### Performance
- **Choose Nearby Regions**: Deploy to regions close to your users
- **Standard Tier**: Use Standard tier for production workloads
- **CDN**: Azure Static Web Apps includes global CDN automatically

### Maintenance
- **Version Tracking**: Tag deployments with version numbers
- **Backup Configuration**: Export app registration settings
- **Monitor Health**: Set up health checks and monitoring

## Support

For issues with standalone deployment:

1. **Check Logs**: Review Azure Static Web App deployment logs
2. **Verify Prerequisites**: Ensure Azure CLI and PowerShell are current
3. **Test Connectivity**: Verify network access to Azure services
4. **Contact Support**: Use GitHub Issues for community support

## Next Steps

After successful deployment:

1. **Test with Users**: Have representative users test the application
2. **Monitor Usage**: Review Azure Static Web Apps metrics
3. **Plan Updates**: Establish process for updating the application
4. **Document Access**: Create user guides for your organization
