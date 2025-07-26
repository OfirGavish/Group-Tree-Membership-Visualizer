#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Sets up GitHub repository secrets for automated deployment workflow
.DESCRIPTION
    This script helps configure GitHub repository secrets needed for the automated build and upload workflow.
.PARAMETER GitHubToken
    GitHub Personal Access Token with repo scope
.PARAMETER RepositoryOwner
    GitHub repository owner (username or organization)
.PARAMETER RepositoryName
    GitHub repository name
.PARAMETER StorageAccountKey
    Azure Storage Account key for uploading files
#>

param(
    [Parameter(Mandatory = $false)]
    [string]$GitHubToken,
    
    [Parameter(Mandatory = $false)]
    [string]$RepositoryOwner = "OfirGavish",
    
    [Parameter(Mandatory = $false)]
    [string]$RepositoryName = "Group-Tree-Membership-Visualizer",
    
    [Parameter(Mandatory = $false)]
    [string]$StorageAccountKey
)

# Configuration
$StorageAccountName = "mscnstorage"
$ContainerName = "`$web"
$ReleasesFolder = "releases"
$CustomDomain = "storage.mscloudninja.com"

Write-Host "🔧 GitHub Secrets Setup for Group Tree Membership Visualizer" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if GitHub CLI is installed
if (-not (Get-Command "gh" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ GitHub CLI (gh) is not installed." -ForegroundColor Red
    Write-Host "Please install it from: https://cli.github.com/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: Set secrets manually in GitHub repository settings:" -ForegroundColor Yellow
    Write-Host "  https://github.com/$RepositoryOwner/$RepositoryName/settings/secrets/actions" -ForegroundColor Blue
    exit 1
}

# Check GitHub authentication
gh auth status 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not authenticated with GitHub CLI." -ForegroundColor Red
    Write-Host "Please run: gh auth login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ GitHub CLI is installed and authenticated" -ForegroundColor Green

# Get storage account key if not provided
if (-not $StorageAccountKey) {
    Write-Host ""
    Write-Host "📝 Storage Account Configuration:" -ForegroundColor Yellow
    Write-Host "  Account Name: $StorageAccountName" -ForegroundColor White
    Write-Host "  Container: $ContainerName" -ForegroundColor White
    Write-Host "  Releases Folder: $ReleasesFolder" -ForegroundColor White
    Write-Host "  Custom Domain: $CustomDomain" -ForegroundColor White
    Write-Host ""
    
    $StorageAccountKey = Read-Host "Enter Azure Storage Account Key"
    
    if (-not $StorageAccountKey) {
        Write-Host "❌ Storage account key is required" -ForegroundColor Red
        exit 1
    }
}

# Set GitHub secrets
Write-Host ""
Write-Host "🔐 Setting GitHub repository secrets..." -ForegroundColor Yellow

try {
    # Set AZURE_STORAGE_KEY secret
    Write-Host "  Setting AZURE_STORAGE_KEY..." -ForegroundColor White
    $env:GITHUB_TOKEN = $GitHubToken
    Write-Output $StorageAccountKey | gh secret set AZURE_STORAGE_KEY --repo "$RepositoryOwner/$RepositoryName"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ AZURE_STORAGE_KEY set successfully" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Failed to set AZURE_STORAGE_KEY" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "🎉 GitHub secrets configured successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Display configuration summary
    Write-Host "📋 Configuration Summary:" -ForegroundColor Cyan
    Write-Host "├── Repository: $RepositoryOwner/$RepositoryName" -ForegroundColor White
    Write-Host "├── Storage Account: $StorageAccountName" -ForegroundColor White
    Write-Host "├── Container: $ContainerName" -ForegroundColor White
    Write-Host "├── Releases Folder: $ReleasesFolder" -ForegroundColor White
    Write-Host "├── Custom Domain: $CustomDomain" -ForegroundColor White
    Write-Host "└── Secrets: AZURE_STORAGE_KEY ✅" -ForegroundColor White
    Write-Host ""
    
    # Display next steps
    Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Push changes to trigger the workflow:" -ForegroundColor White
    Write-Host "   git add ." -ForegroundColor Gray
    Write-Host "   git commit -m 'Configure automated deployment with storage'" -ForegroundColor Gray
    Write-Host "   git push origin main" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Or create a new release tag:" -ForegroundColor White
    Write-Host "   git tag v1.1.0" -ForegroundColor Gray
    Write-Host "   git push origin v1.1.0" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Monitor the workflow at:" -ForegroundColor White
    Write-Host "   https://github.com/$RepositoryOwner/$RepositoryName/actions" -ForegroundColor Blue
    Write-Host ""
    Write-Host "4. After successful build, test deployment:" -ForegroundColor White
    Write-Host "   https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2F$RepositoryOwner%2F$RepositoryName%2Fmain%2Fazuredeploy-automated-simple.json" -ForegroundColor Blue
    Write-Host ""
    
} catch {
    Write-Host "❌ Error setting GitHub secrets: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Manual Setup Instructions:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://github.com/$RepositoryOwner/$RepositoryName/settings/secrets/actions" -ForegroundColor Blue
    Write-Host "2. Click 'New repository secret'" -ForegroundColor White
    Write-Host "3. Add secret:" -ForegroundColor White
    Write-Host "   Name: AZURE_STORAGE_KEY" -ForegroundColor Gray
    Write-Host "   Value: [Your storage account key]" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "✨ Setup complete! Your automated deployment workflow is ready." -ForegroundColor Green
Write-Host ""
