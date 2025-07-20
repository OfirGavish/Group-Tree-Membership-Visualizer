# 🚀 Azure Static Web Apps Deployment Guide

## What we've built:
✅ Next.js app with static export  
✅ Azure Static Web Apps configuration  
✅ Built-in authentication ready  
✅ Microsoft Graph integration  

## Step-by-Step Deployment

### 1. Push Code to GitHub

First, let's get your code on GitHub:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit your changes
git commit -m "Initial commit: Group Tree Membership Visualizer"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/group-tree-membership-visualizer.git

# Push to GitHub
git push -u origin main
```

### 2. Create Azure Static Web App

1. **Go to Azure Portal**: https://portal.azure.com
2. **Create Resource** → Search for "Static Web App"
3. **Fill in the details**:
   - **Resource Group**: Create new or use existing
   - **Name**: `group-tree-membership-visualizer`
   - **Plan**: Free (perfect for testing)
   - **Region**: Choose closest to you
   - **Source**: GitHub
   - **GitHub Account**: Sign in to your GitHub
   - **Repository**: Select your repository
   - **Branch**: main
   - **Build preset**: Next.js
   - **App location**: `/` (root)
   - **API location**: (leave empty)
   - **Output location**: `out`

4. **Click "Review + create"** then **"Create"**

### 3. Configure Authentication (The Magic Part!)

After deployment completes:

1. **Go to your Static Web App** in Azure Portal
2. **Navigate to "Authentication"** in the left menu
3. **Click "Add identity provider"**
4. **Select "Microsoft"**
5. **App registration**: Choose "Create new app registration"
6. **Name**: `Group Tree Membership Visualizer`
7. **Supported account types**: Current tenant only
8. **Click "Add"**

🎉 **That's it!** Azure automatically:
- Creates the app registration
- Configures Microsoft Graph permissions
- Sets up the authentication flow
- Handles all the OAuth complexity

### 4. Configure Microsoft Graph Permissions

After authentication is set up:

1. **Go to Azure Active Directory** → **App registrations**
2. **Find your app** (created automatically by Static Web Apps)
3. **Go to "API permissions"**
4. **Click "Add a permission"** → **Microsoft Graph** → **Delegated permissions**
5. **Add these permissions**:
   - `User.Read` (usually already added)
   - `Group.Read.All`
   - `Directory.Read.All`
   - `GroupMember.Read.All`
6. **Click "Grant admin consent"** (requires admin rights)

### 5. Test Your Application

1. **Go to your Static Web App URL** (shown in Azure Portal)
2. **Click "Sign in with Microsoft"**
3. **Authenticate** with your organizational account
4. **Start exploring** group memberships!

## GitHub Actions (Automatic)

Azure Static Web Apps automatically created a GitHub Actions workflow in your repository at `.github/workflows/azure-static-web-apps-<name>.yml`. This workflow:

- ✅ Automatically builds your app when you push to main
- ✅ Deploys to Azure Static Web Apps
- ✅ Runs on every pull request for preview deployments

## Troubleshooting

### "Failed to load users" error
- Check that Microsoft Graph permissions are granted
- Ensure admin consent was provided
- Verify the user has appropriate permissions in your organization

### Authentication not working
- Ensure the app registration redirect URI includes your Static Web App URL
- Check that the identity provider is properly configured

### Build failures
- Check the GitHub Actions logs in your repository
- Ensure all dependencies are in package.json
- Verify the build works locally with `npm run build`

## Next Steps

After successful deployment:

1. **Custom Domain**: Add your own domain in Azure Portal
2. **Monitoring**: Set up Application Insights for monitoring
3. **Security**: Review and audit the Microsoft Graph permissions
4. **Features**: Extend the app with additional Microsoft Graph capabilities

## Cost

- **Azure Static Web Apps**: Free tier (100GB bandwidth, 0.5GB storage)
- **Microsoft Graph API**: Free (within usage limits)
- **Azure Active Directory**: Free tier (for basic features)

Perfect for testing and small-scale deployments! 🎉
