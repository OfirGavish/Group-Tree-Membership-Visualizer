# 🔧 VS Code Azure Static Web Apps Extension Deployment Guide

## Why Your Static Web Apps Are "Waiting for Deployment"

The "Waiting for deployment" status typically occurs because:
1. **GitHub Actions workflow was created but can't access your repository**
2. **Build configuration issues in the workflow**
3. **Missing or incorrect build output location**
4. **Repository permissions not properly set**

## Solution: Use VS Code Azure Static Web Apps Extension

The VS Code extension provides a more reliable deployment method and better debugging.

---

## Step 1: Install Extension (If Not Already Installed)

1. Open **VS Code Extensions** (Ctrl+Shift+X)
2. Search for **"Azure Static Web Apps"**
3. Install the extension by Microsoft
4. Sign in to your Azure account when prompted

---

## Step 2: Prepare Your Application

### Build the Application First:
```bash
npm run build
```

### Verify Build Output:
- Check that `/out` folder exists
- Ensure it contains `index.html` and other static files

---

## Step 3: Deploy Using VS Code Extension

### Method A: Command Palette
1. **Open Command Palette** (Ctrl+Shift+P)
2. Type **"Azure Static Web Apps: Create Static Web App..."**
3. Follow the prompts:
   - **Select subscription**
   - **Enter app name**: `group-tree-visualizer-vscode`
   - **Select region**: East US 2
   - **Select build preset**: Custom
   - **Enter app location**: `/` (root)
   - **Enter build output location**: `out`
   - **API location**: (leave empty)

### Method B: Azure Panel
1. **Open Azure panel** in VS Code (left sidebar)
2. **Expand "Static Web Apps"**
3. **Click "+" to create new app**
4. Follow the same prompts as Method A

---

## Step 4: Configure Build Settings

When prompted for build configuration:

### App Location: `/`
### Build Output Location: `out`
### API Location: (empty)

### Build Command (if asked):
```json
{
  "appLocation": "/",
  "apiLocation": "",
  "outputLocation": "out",
  "buildCommand": "npm run build"
}
```

---

## Step 5: Monitor Deployment

1. **VS Code will show progress** in the bottom panel
2. **Azure panel** will show deployment status
3. **Output panel** will show detailed logs

---

## Step 6: Configure Authentication

After successful deployment:

1. **Go to Azure Portal**
2. **Find your Static Web App** (group-tree-visualizer-vscode)
3. **Click "Authentication"** in left menu
4. **Add identity provider** → **Microsoft**
5. **Accept defaults** and click **"Add"**

---

## Step 7: Add Microsoft Graph Permissions

1. **Azure Portal** → **Azure Active Directory** → **App registrations**
2. **Find your app** (created by Static Web Apps)
3. **API permissions** → **Add permission**
4. **Microsoft Graph** → **Delegated permissions**
5. **Add these permissions**:
   - `User.Read`
   - `Group.Read.All`
   - `Directory.Read.All`
   - `GroupMember.Read.All`
6. **Grant admin consent**

---

## Troubleshooting VS Code Deployment

### Build Fails in VS Code:
```bash
# Run local build first to check for errors
npm run build

# Check if /out folder is created
ls out/
```

### Extension Not Working:
1. **Restart VS Code**
2. **Sign out and sign in to Azure**
3. **Check Azure subscription permissions**

### Authentication Issues:
1. **Ensure you're signed into the correct Azure tenant**
2. **Check subscription access**
3. **Verify resource group permissions**

---

## VS Code Extension Benefits

✅ **Better error handling** than portal deployment  
✅ **Real-time deployment logs** in VS Code  
✅ **Automatic workflow creation** with correct settings  
✅ **Built-in troubleshooting** tools  
✅ **Direct integration** with your development environment  

---

## Alternative: Fix Existing Static Web Apps

If you want to fix your existing "Waiting for deployment" apps:

### Check GitHub Actions:
1. **Go to your repository** on GitHub
2. **Click "Actions" tab**
3. **Look for failed workflows**
4. **Check workflow file** in `.github/workflows/`

### Common Fixes:
1. **Update build output location** to `out`
2. **Ensure repository permissions** are set correctly
3. **Re-trigger the workflow** by pushing a new commit

### Workflow File Should Look Like:
```yaml
app_location: "/"
api_location: ""
output_location: "out"
```

---

## Next Steps After Successful Deployment

1. **Test your application** at the provided URL
2. **Verify authentication** works properly
3. **Test group visualization** features
4. **Share URL** with your team

The VS Code extension approach is often more reliable than the Azure Portal deployment! 🚀
