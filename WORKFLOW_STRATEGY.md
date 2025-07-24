# Workflow Strategy for Development and User Deployment

This document explains the deployment workflow strategy that allows continuous development while enabling users to deploy via the "Deploy to Azure" button.

## Branch Strategy

### For Repository Owner (You)

- **`main`** - Production-ready code, stable releases
- **`develop`** - Your active development branch (create this)
- **`deploy`** - Deployment trigger branch (create this)
- **`feature/*`** - Feature branches for specific features

### For Users Deploying

- **`main`** - Users deploy from this branch via ARM template
- Uses **manual workflow triggers** only (no automatic deployments)

## Workflow Configuration

### Current Workflow Setup

The GitHub Actions workflow (`azure-static-web-apps-brave-smoke-0cd316503.yml`) now supports:

1. **Manual Dispatch** - Perfect for "Deploy to Azure" button
2. **Workflow Call** - Can be triggered by other workflows
3. **Push to specific branches** - Only `deploy`, `release`, and `main`
4. **Pull Request previews** - For code review

### How It Works

#### For Users (Deploy to Azure Button)
```mermaid
graph LR
    A[User clicks Deploy to Azure] --> B[ARM Template Deploys SWA]
    B --> C[Workflow Triggered Manually]
    C --> D[App Built & Deployed]
    D --> E[User runs configure-app.ps1]
```

#### For Your Development
```mermaid
graph LR
    A[Work on develop branch] --> B[Test locally]
    B --> C[Merge to deploy branch]
    C --> D[Workflow Auto-Triggers]
    D --> E[App Deployed]
```

## Setup Instructions

### 1. Create Development Branches

```bash
# Create and switch to develop branch
git checkout -b develop

# Create deploy branch from main
git checkout main
git checkout -b deploy
git push origin deploy

# Switch back to develop for your work
git checkout develop
```

### 2. Update Your Development Workflow

Work on the `develop` branch:
```bash
# Your daily workflow
git checkout develop
# Make changes...
git add .
git commit -m "Add new feature"
git push origin develop

# When ready to deploy
git checkout deploy
git merge develop
git push origin deploy  # This triggers deployment
```

### 3. For Users - No Changes Needed

Users can still:
1. Click "Deploy to Azure" button
2. ARM template creates Static Web App
3. Workflow is triggered manually (not on every push)
4. Run `configure-app.ps1` to set up Azure AD

## Modified Files

### `.github/workflows/azure-static-web-apps-brave-smoke-0cd316503.yml`

```yaml
on:
  # Manual trigger for Deploy to Azure button
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: false
        default: 'production'
        type: choice
        options: [production, staging]
  
  # Push only to specific branches
  push:
    branches: [deploy, release, main]
    paths-ignore: ['**.md']
      
  # Pull requests for previews
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches: [deploy, release, main]
```

### `azuredeploy.json`

Updated to support the new branch strategy:
- Added `deploy` branch option
- Maintains compatibility with existing deployments

## Benefits of This Approach

### ✅ For You (Developer)
- Continue development on `develop` branch
- No accidental deployments on every commit
- Control when deployments happen via `deploy` branch
- Clean separation of development and deployment

### ✅ For Users
- Simple "Deploy to Azure" experience unchanged
- No need to fork repository
- Manual workflow trigger prevents unwanted deployments
- ARM template handles everything automatically

### ✅ For Both
- No conflicts between development and user deployments
- Clean, professional deployment process
- Easy to maintain and understand

## Usage Examples

### Daily Development
```bash
# Your workflow remains simple
git checkout develop
# ... make changes ...
git commit -m "Implement new feature"
git push origin develop

# Deploy when ready
git checkout deploy
git merge develop
git push origin deploy
```

### User Deployment
1. Click "Deploy to Azure" button
2. ARM template creates resources
3. GitHub workflow runs manually (workflow_dispatch)
4. Run configuration script
5. Application ready to use

### Emergency Hotfix
```bash
# Quick fix directly to main
git checkout main
git commit -m "Critical security fix"
git push origin main  # Deploys immediately

# Backport to develop
git checkout develop
git merge main
```

## Migration Steps

1. **Create branches:**
   ```bash
   git checkout -b develop
   git checkout main
   git checkout -b deploy
   git push origin develop deploy
   ```

2. **Update your local workflow:**
   - Work on `develop` branch
   - Merge to `deploy` for deployments
   - Keep `main` for releases

3. **Test the new workflow:**
   - Make a change on `develop`
   - Merge to `deploy`
   - Verify deployment works

4. **Users continue as before:**
   - No changes needed for user experience
   - Deploy to Azure button still works perfectly

This strategy gives you complete control over deployments while maintaining a smooth user experience!
