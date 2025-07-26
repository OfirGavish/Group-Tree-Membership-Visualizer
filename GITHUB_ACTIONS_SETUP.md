# GitHub Actions Setup Guide

## Overview

This guide helps you configure GitHub Actions to automatically build and upload your application to Azure Storage whenever you push to the main branch or create a release tag.

## Storage Account Configuration

Your workflow is now configured to use:
- **Storage Account**: `mscnstorage`
- **Container**: `$web` (static website container)
- **Releases Folder**: `releases` (subfolder within $web container)
- **Custom Domain**: `storage.mscloudninja.com`
- **Blob Endpoint**: `https://mscnstorage.z6.web.core.windows.net/`

## Required GitHub Secrets

You need to set up one GitHub repository secret:

### AZURE_STORAGE_KEY
- **Name**: `AZURE_STORAGE_KEY`
- **Value**: Your Azure Storage Account access key

## Setup Options

### Option 1: Automated Setup (Recommended)

Use the provided PowerShell script:

```powershell
# Run the setup script
.\setup-github-secrets.ps1

# Follow the prompts to enter your storage account key
```

### Option 2: Manual Setup

1. **Go to GitHub Repository Settings**:
   - Navigate to: https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/settings/secrets/actions

2. **Add New Repository Secret**:
   - Click "New repository secret"
   - Name: `AZURE_STORAGE_KEY`
   - Secret: `[Your Azure Storage Account Access Key]`
   - Click "Add secret"

## Workflow Triggers

The workflow will automatically run when:

1. **Push to main branch**: Builds and uploads as "latest" version
2. **Push to develop branch**: Builds and uploads for testing
3. **Create release tag** (v*): Builds, uploads, and creates GitHub release
4. **Manual trigger**: Via GitHub Actions page with custom version

## Testing the Setup

1. **Commit and push changes**:
   ```bash
   git add .
   git commit -m "Configure automated deployment with storage"
   git push origin main
   ```

2. **Monitor the workflow**:
   - Go to: https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/actions
   - Watch the "Build and Upload to Storage" workflow

3. **Verify upload**:
   - Check if files appear in your storage account
   - URL should be: `https://mscnstorage.blob.core.windows.net/$web/releases/group-tree-visualizer-latest.zip`
   - Custom domain: `https://storage.mscloudninja.com/releases/group-tree-visualizer-latest.zip`
   - Static website: `https://mscnstorage.z6.web.core.windows.net/releases/group-tree-visualizer-latest.zip`

## Creating a Release

To create a new versioned release:

```bash
# Create and push a tag
git tag v1.1.0
git push origin v1.1.0
```

This will:
1. Trigger the workflow
2. Build the application
3. Upload to storage as both `group-tree-visualizer-v1.1.0.zip` and `group-tree-visualizer-latest.zip` in the `$web/releases/` folder
4. Create a GitHub release with deployment links

## Deployment URLs

After successful build and upload, users can deploy using:

- **Fully Automated**: https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FOfirGavish%2FGroup-Tree-Membership-Visualizer%2Fmain%2Fazuredeploy-automated-simple.json

The ARM template will automatically download from your storage account and deploy.

## Troubleshooting

### Common Issues

1. **Secret not found error**:
   - Verify `AZURE_STORAGE_KEY` secret is set correctly
   - Check secret name spelling (case-sensitive)

2. **Storage upload fails**:
   - Verify storage account key is correct
   - Check if `$web` container exists and has public blob access
   - Verify the `releases` folder exists within the `$web` container

3. **Workflow doesn't trigger**:
   - Ensure workflow file is in `.github/workflows/` directory
   - Check branch names match your setup

### Workflow Status

Check workflow status at:
- https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/actions

### Storage Verification

Verify files are uploaded:
- Direct URL: `https://mscnstorage.blob.core.windows.net/$web/releases/`
- Custom domain: `https://storage.mscloudninja.com/releases/`
- Static website: `https://mscnstorage.z6.web.core.windows.net/releases/`

## Next Steps

1. **Set up the GitHub secret** using one of the methods above
2. **Test with a commit** to main branch
3. **Create a release tag** for the first official version
4. **Share the deployment URL** with your users

The automated deployment will then work seamlessly without any GitHub authorization requirements!
