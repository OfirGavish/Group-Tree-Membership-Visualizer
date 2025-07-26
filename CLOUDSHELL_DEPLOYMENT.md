# 🌳 Azure Cloud Shell Deployment Guide

## 🎯 **One-Click Cloud Shell Deployment**

**The most reliable deployment method - runs in your Azure environment with your permissions!**

### 🚀 **Quick Deploy (Recommended)**

Click the button below to open Azure Cloud Shell with the deployment script pre-loaded:

[![Deploy via Cloud Shell](https://shell.azure.com/images/launchcloudshell.png)](https://shell.azure.com/bash)

**Manual Steps:**
1. **Click the Cloud Shell button** above to open Azure Cloud Shell
2. **Run the deployment command:**
   ```bash
   curl -s https://raw.githubusercontent.com/OfirGavish/Group-Tree-Membership-Visualizer/main/deploy-cloudshell.sh | bash
   ```
3. **Follow the interactive prompts** to configure your deployment
4. **Wait for completion** (usually 3-5 minutes)
5. **Configure MSAL authentication** using the provided command

### 🎪 **Pre-configured Cloud Shell Link**

For an even smoother experience, use this pre-configured link that loads the script automatically:

```
https://shell.azure.com/bash?cloudEnvironment=AzureCloud&firstRun=false#curl%20-s%20https://raw.githubusercontent.com/OfirGavish/Group-Tree-Membership-Visualizer/main/deploy-cloudshell.sh%20%7C%20bash
```

## ✨ **Why Cloud Shell is Better**

| Feature | Cloud Shell Deployment | ARM Template Scripts |
|---------|------------------------|---------------------|
| **Reliability** | ✅ High (user context) | ❌ Low (container limits) |
| **Debugging** | ✅ Interactive output | ❌ Hidden logs |
| **Permissions** | ✅ User's own permissions | ⚠️ Managed identity complexity |
| **Environment** | ✅ Proven, stable | ❌ Container resource constraints |
| **User Control** | ✅ Full control | ❌ Black box execution |
| **Speed** | ✅ Fast (3-5 minutes) | ❌ Often fails after 3 seconds |

## 📋 **What the Script Does**

### **Step 1: Configuration**
- Prompts for app name, region, and resource group
- Uses sensible defaults for quick deployment
- Shows deployment summary before proceeding

### **Step 2: Infrastructure**
- Creates resource group if needed
- Creates Azure Static Web App with minimal GitHub dependency
- Retrieves deployment token directly

### **Step 3: Application Deployment**
- Downloads pre-built application from storage
- Falls back to GitHub releases if needed
- Extracts and validates static files

### **Step 4: Static Web App Deployment**
- Installs SWA CLI in Cloud Shell
- Deploys static files using deployment token
- Provides immediate feedback and next steps

## 🔧 **Manual Deployment (Advanced)**

If you prefer to run commands manually:

```bash
# 1. Set variables
STATIC_WEB_APP_NAME="my-group-visualizer"
RESOURCE_GROUP="rg-group-visualizer"
LOCATION="East US 2"

# 2. Create infrastructure
az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
az staticwebapp create \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --source "https://github.com/Azure-Samples/static-web-apps-blank"

# 3. Get deployment token
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
    --name "$STATIC_WEB_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.apiKey" -o tsv)

# 4. Download and deploy
curl -L "https://storage.mscloudninja.com/releases/group-tree-visualizer-latest.zip" -o app.zip
unzip app.zip
npm install -g @azure/static-web-apps-cli
swa deploy . --deployment-token "$DEPLOYMENT_TOKEN"
```

## 🎉 **Post-Deployment**

After successful deployment:

1. **🌐 Access your app**: `https://your-app-name.azurestaticapps.net`
2. **🔐 Configure authentication**:
   ```bash
   curl -s https://raw.githubusercontent.com/OfirGavish/Group-Tree-Membership-Visualizer/main/configure-app.ps1 > configure-app.ps1
   pwsh ./configure-app.ps1 -StaticWebAppName "your-app-name"
   ```

## 🤔 **Troubleshooting**

### **Common Issues:**

| Issue | Solution |
|-------|----------|
| "az command not found" | Use Cloud Shell (CLI pre-installed) |
| "staticwebapp command not found" | Run `az extension add --name staticwebapp` |
| "Permission denied" | Ensure you have Contributor role on subscription |
| "Download failed" | Check internet connectivity or try GitHub fallback |
| "SWA CLI not found" | Run `npm install -g @azure/static-web-apps-cli` |

### **Getting Help:**
- **Real-time Output**: Cloud Shell shows detailed progress
- **Interactive Debugging**: You can modify commands as needed
- **Full Control**: Stop, modify, and restart at any point

## 🌟 **Benefits of This Approach**

1. **🔒 No GitHub Authorization Required**: Completely eliminates GitHub dependency
2. **🚀 Reliable Execution**: Runs in proven Azure Cloud Shell environment
3. **🔍 Full Transparency**: See exactly what's happening in real-time
4. **⚡ Fast Deployment**: Usually completes in 3-5 minutes
5. **🛠️ Easy Troubleshooting**: Interactive environment for debugging
6. **🎯 User-Friendly**: Familiar Cloud Shell interface
7. **💪 Proven Technology**: Uses same tools that work in local development

---

**This Cloud Shell approach provides the reliability and user experience that ARM template deployment scripts have been struggling to deliver! 🎉**
