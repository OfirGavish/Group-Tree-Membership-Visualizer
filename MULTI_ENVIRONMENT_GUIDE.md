# Multi-Environment Setup Guide

This guide explains how to set up and use multiple environments (Development, Staging, Production) for your Group Tree Membership Visualizer application.

## Overview

Your application now supports three deployment environments:

1. **Development** (`develop` branch) - For active development and testing
2. **Staging** (`deploy` branch) - For pre-production testing (optional)  
3. **Production** (`release`/`main` branch) - For end users

Each environment deploys to a separate Azure Static Web App with its own URL and configuration.

## Prerequisites

Before setting up multi-environment deployment, ensure you have:

- ✅ Azure CLI installed and logged in
- ✅ GitHub CLI installed (`gh`)
- ✅ GitHub Personal Access Token with `repo` permissions
- ✅ At least two Azure Static Web Apps created (Development and Production)

## Step 1: Create Development Environment

If you haven't created a development Static Web App yet:

```powershell
# Create a development Static Web App
.\create-dev-environment.ps1 -DevAppName "group-tree-dev"
```

This script will:
- Create a new Static Web App named "group-tree-dev"
- Configure it to deploy from the `develop` branch
- Set up the resource group and deployment token

## Step 2: Set Up Repository Secrets

Configure GitHub repository secrets for all environments:

```powershell
.\setup-repository-secrets.ps1 `
    -RepoOwner "yourusername" `
    -RepoName "Group-Tree-Membership-Visualizer" `
    -GitHubToken "ghp_your_github_token_here" `
    -DevStaticWebAppName "group-tree-dev" `
    -ProductionStaticWebAppName "brave-smoke-0cd316503" `
    -ResourceGroupName "rg-group-tree"
```

**Required GitHub Token Permissions:**
- Go to GitHub → Settings → Developer settings → Personal access tokens
- Create a token with `repo` scope (full repository access)

This will set up these repository secrets:
- `AZURE_STATIC_WEB_APPS_API_TOKEN_DEV` - Development environment
- `AZURE_STATIC_WEB_APPS_API_TOKEN_STAGING` - Staging environment (optional)
- `AZURE_STATIC_WEB_APPS_API_TOKEN_BRAVE_SMOKE_0CD316503` - Production environment

## Step 3: Configure Branch Structure

Set up your Git branches for the workflow:

```bash
# Create and switch to develop branch
git checkout -b develop

# Create deploy branch (for staging)
git checkout -b deploy

# Create release branch (for production)
git checkout -b release

# Go back to main development branch
git checkout develop
```

## Deployment Workflow

### Automatic Deployments

The GitHub Actions workflow automatically deploys based on branch pushes:

| Branch | Environment | Static Web App | Trigger |
|--------|-------------|----------------|---------|
| `develop` | Development | `group-tree-dev` | Push to develop |
| `deploy` | Staging | `brave-smoke-0cd316503` | Push to deploy |
| `main` | User Deployments | User's own Static Web App | Deploy to Azure button |

### Manual Deployments

You can also trigger deployments manually:

1. Go to your GitHub repository
2. Click **Actions** → **Azure Static Web Apps CI/CD**
3. Click **Run workflow**
4. Choose the environment (production/staging)
5. Click **Run workflow**

### Deploy to Azure Button

The Deploy to Azure button will:
- Create a new Static Web App for the user
- Deploy from the `main` branch by default
- Not consume your GitHub Actions minutes (uses the user's account)

## Development Workflow

### Daily Development
```bash
# Work on the develop branch
git checkout develop

# Make your changes
git add .
git commit -m "Add new feature"
git push origin develop
```
This automatically deploys to your development environment.

### Staging Release
```bash
# Merge develop into deploy for staging
git checkout deploy
git merge develop
git push origin deploy
```
This deploys to the staging environment for testing.

### Production Release
```bash
# When ready for users, merge to main branch
git checkout main
git merge deploy
git push origin main
```
**Note**: This doesn't trigger automatic deployment. Users will deploy from `main` branch using the "Deploy to Azure" button.

## Environment URLs

After deployment, your environments will be available at:

- **Development**: `https://group-tree-dev.azurestaticapps.net`
- **Production**: `https://brave-smoke-0cd316503.azurestaticapps.net`

## Configuration Management

Each environment can have different configurations:

### Azure AD App Registrations
Consider creating separate Azure AD app registrations for each environment:

```powershell
# Configure development environment
.\configure-app.ps1 -AppName "Group Tree Visualizer (Dev)" -StaticWebAppName "group-tree-dev"

# Configure production environment  
.\configure-app.ps1 -AppName "Group Tree Visualizer" -StaticWebAppName "brave-smoke-0cd316503"
```

### Environment-Specific Settings

You can configure different settings per environment in the application code:

```typescript
// src/lib/config.ts
const config = {
  development: {
    apiBaseUrl: 'https://group-tree-dev.azurestaticapps.net/api',
    clientId: 'dev-client-id',
    redirectUri: 'https://group-tree-dev.azurestaticapps.net',
  },
  production: {
    apiBaseUrl: 'https://brave-smoke-0cd316503.azurestaticapps.net/api', 
    clientId: 'prod-client-id',
    redirectUri: 'https://brave-smoke-0cd316503.azurestaticapps.net',
  }
};

export default config[process.env.NODE_ENV || 'production'];
```

## Troubleshooting

### Deployment Fails
1. Check that the correct repository secrets are set
2. Verify the Static Web App exists in Azure
3. Ensure the deployment token is valid

### Wrong Environment Deployed
1. Check which branch you're pushing to
2. Verify the workflow file branch mappings
3. Check the GitHub Actions logs

### Missing Secrets
Re-run the setup script:
```powershell
.\setup-repository-secrets.ps1 -RepoOwner "yourusername" -RepoName "repo-name" ...
```

## Benefits of This Setup

✅ **Safe Development** - Test changes in isolation before production  
✅ **Controlled Releases** - Staged deployment process  
✅ **Zero Downtime** - Production remains stable during development  
✅ **Easy Rollbacks** - Can quickly revert to previous release  
✅ **Multiple Configurations** - Different Azure AD apps per environment  
✅ **Team Collaboration** - Separate environments for different teams  

## Next Steps

1. Test the development workflow by pushing to `develop`
2. Configure Azure AD app registrations for each environment
3. Set up monitoring and alerts for production environment
4. Create branch protection rules for `release` branch
5. Set up automated testing in the CI/CD pipeline

For more advanced configurations, see the Azure Static Web Apps documentation.
