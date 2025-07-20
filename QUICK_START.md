# 🚀 Quick Start Guide

## Option 1: One-Click Deploy to Azure (Easiest!)

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FOfirGavish%2FGroup-Tree-Membership-Visualizer%2Fmain%2Fazuredeploy.json)

### Steps:
1. **Click the "Deploy to Azure" button** above
2. **Sign in** to your Azure account
3. **Fill in deployment details**:
   - **Subscription**: Choose your Azure subscription
   - **Resource Group**: Create new or use existing
   - **Site Name**: Auto-generated (or customize)
   - **Location**: Choose closest region
   - **SKU**: Free (perfect for testing)
4. **Click "Review + create"** then **"Create"**
5. **Wait for deployment** (takes 2-3 minutes)

### After Deployment:
1. **Go to your Static Web App** in Azure Portal
2. **Click "Authentication"** in the left menu
3. **Add identity provider** → **Microsoft**
4. **Accept defaults** and click **"Add"**
5. **Visit your app URL** and test!

**Total time: ~5 minutes** ⚡

---

## Option 2: Manual GitHub Setup

If you want to fork the repository first:

### Step 1: Fork Repository
1. **Fork this repository** to your GitHub account
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Group-Tree-Membership-Visualizer.git
   cd Group-Tree-Membership-Visualizer
   ```

### Step 2: Deploy with Your Fork
1. **Update the Deploy button** in your README to point to your fork
2. **Click Deploy to Azure** and use your repository URL
3. **Follow the same deployment steps** as Option 1

---

## Local Development (Optional)

Want to test locally first?

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

**Note**: Authentication only works after Azure deployment, but you can see the UI locally.

---

## What Gets Created

Your deployment creates:

✅ **Azure Static Web App** - Hosts your application  
✅ **GitHub Actions Workflow** - Automatic deployments  
✅ **Microsoft App Registration** - Authentication (created automatically)  
✅ **Microsoft Graph Permissions** - Data access  

**No manual app registration needed!** 🎉

---

## Troubleshooting

### Deployment Failed?
- Check if site name is unique globally
- Ensure you have Owner/Contributor access to the subscription
- Try a different Azure region

### Authentication Not Working?
- Ensure you completed the "After Deployment" steps
- Check that Microsoft identity provider was added
- Verify you're signing in with an organizational account

### Can't See Users/Groups?
- Ensure admin consent was granted
- Check that your account has appropriate permissions
- Contact your IT administrator if needed

---

## Next Steps

After successful deployment:

1. **Test the application** with your organizational account
2. **Share the URL** with your team
3. **Customize the application** if needed
4. **Set up monitoring** (optional)

## Support

Need help? Check:
- [Detailed Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Multi-Tenant Setup](./MULTI_TENANT_SETUP.md)
- [GitHub Issues](https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/issues)

**Happy visualizing!** 🌳👥

---
**No custom app registration needed!** Azure Static Web Apps handles everything automatically. 🚀
