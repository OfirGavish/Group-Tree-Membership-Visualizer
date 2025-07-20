# 🔍 Debugging "Waiting for Deployment" with VS Code Extension

## Step 1: Open Azure Extension Panel

1. **Open VS Code Azure panel** (left sidebar, Azure icon)
2. **Sign in** to your Azure account if not already signed in
3. **Expand "Static Web Apps"** section
4. **Look for your stuck deployments**

---

## Step 2: Check Deployment Status in VS Code

### View Your Static Web Apps:
1. **In Azure panel** → **Static Web Apps**
2. **Right-click** on your stuck app
3. **Select "View in Portal"** - this opens Azure Portal
4. **Check the "Overview" tab** for status details

### Alternative: Use Command Palette
1. **Ctrl+Shift+P** → `Azure Static Web Apps: View Static Web App in Portal`
2. **Select your stuck app**

---

## Step 3: Check GitHub Actions Status

### From VS Code:
1. **Ctrl+Shift+P** → `Azure Static Web Apps: View GitHub Actions`
2. **Select your app** → this opens GitHub Actions in browser
3. **Look for failed or stuck workflows**

### What to Look For:
- ❌ **Failed builds** (red X)
- ⏳ **Stuck workflows** (spinning for too long)
- 🔄 **Queued jobs** that never start

---

## Step 4: Check Workflow Configuration

### View Workflow File:
1. **In VS Code Explorer**, navigate to:
   ```
   .github/workflows/azure-static-web-apps-*.yml
   ```
2. **Check these settings**:
   ```yaml
   app_location: "/"           # Should be root
   api_location: ""            # Should be empty
   output_location: "out"      # Should match our build output
   ```

### Common Issues:
```yaml
# ❌ WRONG:
output_location: "build"      # Should be "out"
output_location: "dist"       # Should be "out"
output_location: ".next"      # Should be "out"

# ✅ CORRECT:
output_location: "out"
```

---

## Step 5: Debug Using VS Code Extension

### Check Deployment Logs:
1. **Azure panel** → **Static Web Apps** → **Your app**
2. **Right-click** → **"View deployment history"**
3. **Click on latest deployment** to see logs

### View Build Logs:
1. **Command Palette** → `Azure Static Web Apps: View build logs`
2. **Select your app**
3. **Review error messages**

---

## Step 6: Common "Waiting for Deployment" Causes

### 1. Incorrect Build Output Location
**Problem**: Workflow is looking for files in wrong directory
**Solution**: Update workflow file:
```yaml
output_location: "out"  # Must match Next.js static export
```

### 2. GitHub Actions Quota Exceeded
**Problem**: Free GitHub accounts have limited Actions minutes
**Solution**: Check GitHub billing/usage

### 3. Repository Permissions
**Problem**: Static Web App can't access your repository
**Solution**: Re-authorize GitHub connection

### 4. Build Failures
**Problem**: npm install or npm run build fails
**Solution**: Check workflow logs for build errors

---

## Step 7: Fix Using VS Code Extension

### Method 1: Recreate with Correct Settings
1. **Delete stuck app** (right-click → Delete)
2. **Create new one** with VS Code extension:
   ```
   Ctrl+Shift+P → Azure Static Web Apps: Create Static Web App
   ```
3. **Use these exact settings**:
   - App location: `/`
   - Build output: `out`
   - API location: (empty)

### Method 2: Update Existing App
1. **Right-click app** → **"Open workflow file"**
2. **Edit the workflow** to fix settings
3. **Commit and push** changes
4. **Monitor in GitHub Actions**

---

## Step 8: Alternative: Deploy Pre-built Files

If GitHub Actions keeps failing:

### Upload Built Files Directly:
1. **Build locally**: `npm run build`
2. **Command Palette** → `Azure Static Web Apps: Deploy to Static Web App`
3. **Select your app**
4. **Choose the `/out` folder**
5. **VS Code uploads files directly** (bypasses GitHub Actions)

---

## Step 9: Check from Azure Portal

### Portal Diagnostics:
1. **Azure Portal** → **Your Static Web App**
2. **Left menu** → **"Configuration"**
3. **Check "Build" tab**:
   ```json
   {
     "appLocation": "/",
     "apiLocation": "",
     "outputLocation": "out"
   }
   ```

### Deployment Center:
1. **Left menu** → **"Deployment Center"**
2. **Check GitHub connection status**
3. **View recent deployments**

---

## Step 10: VS Code Extension Commands for Debugging

Open Command Palette (Ctrl+Shift+P) and try:

```
Azure Static Web Apps: View Static Web App in Portal
Azure Static Web Apps: View GitHub Actions
Azure Static Web Apps: View deployment history
Azure Static Web Apps: Browse Static Web App
Azure Static Web Apps: Deploy to Static Web App
Azure Static Web Apps: View build logs
```

---

## Quick Fix Commands

### Check Current Status:
```powershell
# List your Static Web Apps
az staticwebapp list --output table

# Check specific app status
az staticwebapp show --name "your-app-name" --resource-group "your-rg"
```

### Force Redeploy:
```powershell
# Trigger new deployment
az staticwebapp environment set --name "your-app-name" --environment-name "default"
```

---

## Next Steps

After diagnosing the issue:

1. **If GitHub Actions is the problem** → Use VS Code direct deployment
2. **If configuration is wrong** → Update workflow file
3. **If permissions issue** → Reconnect GitHub
4. **If quota exceeded** → Consider paid GitHub plan or alternative deployment

Let me know what you find in the VS Code extension diagnostics! 🔍
