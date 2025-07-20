# 📦 Direct Deployment Options (No GitHub Required)

For administrators who don't have GitHub accounts or prefer direct deployment methods.

## Option 1: Azure CLI Deployment (Recommended)

### Prerequisites
- Azure CLI installed
- Azure subscription access
- PowerShell or Command Prompt

### Steps:

1. **Download the release files**:
   ```bash
   # Download the latest release ZIP
   curl -L -o group-tree-visualizer.zip https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/archive/refs/heads/main.zip
   
   # Extract files
   unzip group-tree-visualizer.zip
   cd Group-Tree-Membership-Visualizer-main
   ```

2. **Build the application**:
   ```bash
   # Install Node.js dependencies
   npm install
   
   # Build for production
   npm run build
   ```

3. **Deploy with Azure CLI**:
   ```bash
   # Login to Azure
   az login
   
   # Create resource group (optional)
   az group create --name rg-group-tree-visualizer --location "East US 2"
   
   # Create Static Web App
   az staticwebapp create \
     --name "group-tree-visualizer-$(Get-Random)" \
     --resource-group "rg-group-tree-visualizer" \
     --source "./out" \
     --location "East US 2" \
     --branch "main" \
     --app-location "/" \
     --output-location "out"
   ```

---

## Option 2: Azure Portal Upload (Simplest)

### Steps:

1. **Download pre-built files**:
   - Go to: [Releases Page](https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/releases)
   - Download `group-tree-visualizer-build.zip`
   - Extract to a folder

2. **Create Static Web App in Azure Portal**:
   - Go to [Azure Portal](https://portal.azure.com)
   - Create Resource → Static Web App
   - Choose "Other" as source
   - Upload the extracted folder
   - Configure authentication

---

## Option 3: Azure PowerShell Deployment

### PowerShell Script:

```powershell
# Azure PowerShell deployment script
# Save as: deploy-group-tree-visualizer.ps1

# Login to Azure
Connect-AzAccount

# Set variables
$resourceGroupName = "rg-group-tree-visualizer"
$staticWebAppName = "group-tree-visualizer-$(Get-Random)"
$location = "East US 2"

# Create resource group
New-AzResourceGroup -Name $resourceGroupName -Location $location

# Create Static Web App using ARM template
$templateUri = "https://raw.githubusercontent.com/OfirGavish/Group-Tree-Membership-Visualizer/main/azuredeploy.json"

New-AzResourceGroupDeployment `
  -ResourceGroupName $resourceGroupName `
  -TemplateUri $templateUri `
  -siteName $staticWebAppName `
  -location $location

Write-Host "Deployment completed! Check Azure Portal for your new Static Web App."
```

---

## Option 4: Container Deployment (Advanced)

For organizations that prefer container-based deployments:

### Docker Deployment:

```bash
# Build container
docker build -t group-tree-visualizer .

# Run locally
docker run -p 3000:3000 group-tree-visualizer

# Deploy to Azure Container Instances
az container create \
  --resource-group rg-group-tree-visualizer \
  --name group-tree-visualizer \
  --image group-tree-visualizer \
  --dns-name-label group-tree-visualizer-$(shuf -i 1000-9999 -n 1) \
  --ports 3000
```

---

## Option 5: Pre-Built Release Packages

### For IT Departments:

We provide pre-built packages for common deployment scenarios:

1. **Azure Static Web Apps Package** (`azure-swa-package.zip`)
   - Pre-built `/out` folder
   - Configuration files
   - Deployment scripts

2. **IIS Package** (`iis-package.zip`)
   - Built for Windows IIS
   - Web.config included
   - Authentication setup guide

3. **Container Package** (`container-package.zip`)
   - Dockerfile
   - Docker Compose
   - Kubernetes manifests

### Download Links:
- [Latest Release Packages](https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/releases/latest)

---

## Authentication Setup (Required for All Options)

After deployment using any method:

1. **Go to Azure Portal** → Your Static Web App/Container
2. **Enable Authentication**:
   - Add Microsoft identity provider
   - Create app registration (automatic)
   - Configure Graph API permissions

3. **Required Permissions**:
   - `User.Read`
   - `Group.Read.All`
   - `Directory.Read.All`
   - `GroupMember.Read.All`

---

## Comparison of Deployment Methods

| Method | GitHub Required | Complexity | Time | Best For | Prerequisites |
|--------|-----------------|------------|------|----------|---------------|
| **Deploy to Azure Button** | ❌ No | 🟢 Easy | 3 min | Quick testing | Azure account |
| **Azure CLI Script** | ❌ No | 🟡 Medium | 5 min | IT professionals | Azure CLI, Node.js |
| **PowerShell Script** | ❌ No | 🟡 Medium | 5 min | Windows admins | Azure PowerShell |
| **Windows Batch Script** | ❌ No | 🟡 Medium | 5 min | Windows users | Azure CLI, Node.js |
| **Azure Portal Upload** | ❌ No | 🟢 Easy | 10 min | Non-technical users | Pre-built files |
| **Container** | ❌ No | 🔴 Advanced | 15 min | DevOps teams | Docker |
| **Pre-built Packages** | ❌ No | 🟢 Easy | 5 min | Enterprise IT | Download only |

---

## Quick Command Reference

### Download and Run Scripts:

**Linux/macOS (Bash)**:
```bash
curl -L -o deploy.sh https://raw.githubusercontent.com/OfirGavish/Group-Tree-Membership-Visualizer/main/deploy-azure-cli.sh
chmod +x deploy.sh
./deploy.sh
```

**Windows (PowerShell)**:
```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/OfirGavish/Group-Tree-Membership-Visualizer/main/deploy-azure-powershell.ps1" -OutFile "deploy.ps1"
.\deploy.ps1
```

**Windows (Command Prompt)**:
```cmd
curl -L -o deploy.bat https://raw.githubusercontent.com/OfirGavish/Group-Tree-Membership-Visualizer/main/deploy-windows.bat
deploy.bat
```

### Direct ARM Template Deployment:

```bash
# Create resource group
az group create --name rg-group-tree-visualizer --location "East US 2"

# Deploy without GitHub
az deployment group create \
  --resource-group rg-group-tree-visualizer \
  --template-uri "https://raw.githubusercontent.com/OfirGavish/Group-Tree-Membership-Visualizer/main/azuredeploy-direct.json" \
  --parameters siteName="your-unique-name"
```

---

## Support for Non-GitHub Deployments

### Getting Help:
- 📧 Email: [Create an issue](https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/issues) (no GitHub account needed)
- 📖 Documentation: All guides are available without GitHub access
- 🔄 Updates: Download new releases as they become available

### Enterprise Support:
For organizations needing:
- Custom deployment packages
- On-premises deployment options
- White-label versions
- Advanced authentication setups

Contact via the issues page for enterprise deployment assistance.

---

## Next Steps

Choose the deployment method that best fits your organization:

1. **Technical users**: Azure CLI or PowerShell
2. **Non-technical users**: Azure Portal Upload
3. **Enterprise environments**: Pre-built packages
4. **Container platforms**: Docker deployment

All methods result in the same fully-functional application! 🚀
