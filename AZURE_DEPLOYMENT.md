# Azure deployment configuration for Group Tree Membership Visualizer

## Recommended: Azure Static Web Apps with Built-in Authentication

### Why this approach?
- ✅ **No custom app registration required** - Azure creates it automatically
- ✅ **Simplified deployment** - One-click deployment from GitHub
- ✅ **Built-in authentication** - Microsoft provider configured automatically
- ✅ **Free tier available** - Perfect for testing and small deployments
- ✅ **Enterprise security** - Same security as custom app registration
- ✅ **Automatic HTTPS and CDN** - Production-ready out of the box

### Setup Steps:

1. **Push code to GitHub repository**

2. **Create Azure Static Web App:**
   - Go to Azure Portal → Create Resource → Static Web App
   - Connect to your GitHub repository
   - Build preset: Next.js
   - App location: `/`
   - API location: (leave empty)
   - Output location: `out`

3. **Enable Authentication:**
   - In Azure Portal → Your Static Web App → Authentication
   - Add Identity Provider → Microsoft
   - Azure automatically creates and configures the app registration
   - No manual permissions needed!

4. **Configure Microsoft Graph permissions (Azure handles this automatically):**
   - User.Read (Delegated)
   - Group.Read.All (Delegated)  
   - Directory.Read.All (Delegated)
   - GroupMember.Read.All (Delegated)

### No Environment Variables Needed!
The built-in authentication handles everything automatically.

## Alternative: Azure App Service (if you need more control)

# For GitHub Actions deployment, see: .github/workflows/azure-static-web-apps.yml
