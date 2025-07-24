#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Sets up GitHub repository secrets for multi-environment deployment

.DESCRIPTION
    This script helps you configure GitHub repository secrets for your Static Web Apps
    across multiple environments (Development, Staging, Production).

.PARAMETER RepoOwner
    GitHub repository owner (username or organization)

.PARAMETER RepoName
    GitHub repository name

.PARAMETER GitHubToken
    GitHub Personal Access Token with repo permissions

.PARAMETER DevStaticWebAppName
    Name of the development Static Web App in Azure

.PARAMETER StagingStaticWebAppName
    Name of the staging Static Web App in Azure (optional)

.PARAMETER ProductionStaticWebAppName
    Name of the production Static Web App in Azure

.PARAMETER ResourceGroupName
    Azure Resource Group name containing the Static Web Apps

.EXAMPLE
    .\setup-repository-secrets.ps1 -RepoOwner "yourusername" -RepoName "Group-Tree-Membership-Visualizer" -GitHubToken "ghp_xxxx" -DevStaticWebAppName "group-tree-dev" -ProductionStaticWebAppName "brave-smoke-0cd316503"
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$RepoOwner,
    
    [Parameter(Mandatory = $true)]
    [string]$RepoName,
    
    [Parameter(Mandatory = $true)]
    [string]$GitHubToken,
    
    [Parameter(Mandatory = $true)]
    [string]$DevStaticWebAppName,
    
    [Parameter(Mandatory = $false)]
    [string]$StagingStaticWebAppName,
    
    [Parameter(Mandatory = $true)]
    [string]$ProductionStaticWebAppName,
    
    [Parameter(Mandatory = $false)]
    [string]$ResourceGroupName = "rg-group-tree"
)

# Function to get Static Web App deployment token
function Get-StaticWebAppToken {
    param(
        [string]$AppName,
        [string]$ResourceGroup
    )
    
    try {
        Write-Host "Getting deployment token for Static Web App: $AppName" -ForegroundColor Yellow
        
        $token = az staticwebapp secrets list --name $AppName --resource-group $ResourceGroup --query "properties.apiKey" --output tsv
        
        if ([string]::IsNullOrEmpty($token)) {
            throw "Failed to retrieve deployment token for $AppName"
        }
        
        return $token
    }
    catch {
        Write-Error "Error getting token for $AppName`: $_"
        return $null
    }
}

# Function to set GitHub repository secret
function Set-GitHubSecret {
    param(
        [string]$SecretName,
        [string]$SecretValue,
        [string]$Owner,
        [string]$Repo,
        [string]$Token
    )
    
    try {
        Write-Host "Setting GitHub secret: $SecretName" -ForegroundColor Green
        
        # Use GitHub CLI to set the secret
        $env:GITHUB_TOKEN = $Token
        Write-Output $SecretValue | gh secret set $SecretName --repo "$Owner/$Repo"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Successfully set secret: $SecretName" -ForegroundColor Green
            return $true
        } else {
            Write-Error "❌ Failed to set secret: $SecretName"
            return $false
        }
    }
    catch {
        Write-Error "Error setting GitHub secret $SecretName`: $_"
        return $false
    }
}

# Main script execution
try {
    Write-Host "🚀 Setting up GitHub repository secrets for multi-environment deployment" -ForegroundColor Cyan
    Write-Host "Repository: $RepoOwner/$RepoName" -ForegroundColor White
    Write-Host ""

    # Check if required tools are installed
    Write-Host "Checking prerequisites..." -ForegroundColor Yellow
    
    # Check Azure CLI
    try {
        $azVersion = az version --query '"azure-cli"' --output tsv
        Write-Host "✅ Azure CLI version: $azVersion" -ForegroundColor Green
    }
    catch {
        Write-Error "❌ Azure CLI is not installed or not in PATH"
        exit 1
    }
    
    # Check GitHub CLI
    try {
        gh --version | Out-Null
        Write-Host "✅ GitHub CLI is available" -ForegroundColor Green
    }
    catch {
        Write-Error "❌ GitHub CLI is not installed or not in PATH"
        Write-Host "Please install GitHub CLI from: https://cli.github.com/" -ForegroundColor Yellow
        exit 1
    }
    
    # Ensure we're logged into Azure
    Write-Host "Checking Azure authentication..." -ForegroundColor Yellow
    $currentUser = az account show --query user.name --output tsv 2>$null
    
    if ([string]::IsNullOrEmpty($currentUser)) {
        Write-Host "Please log into Azure first:" -ForegroundColor Red
        Write-Host "az login" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ Logged into Azure as: $currentUser" -ForegroundColor Green
    Write-Host ""

    # Get deployment tokens for each environment
    $secrets = @{}
    
    # Development environment
    Write-Host "📱 Setting up Development environment..." -ForegroundColor Cyan
    $devToken = Get-StaticWebAppToken -AppName $DevStaticWebAppName -ResourceGroup $ResourceGroupName
    if ($devToken) {
        $secrets["AZURE_STATIC_WEB_APPS_API_TOKEN_DEV"] = $devToken
    } else {
        Write-Error "Failed to get development token. Exiting."
        exit 1
    }

    # Staging environment (optional)
    if (-not [string]::IsNullOrEmpty($StagingStaticWebAppName)) {
        Write-Host "🎭 Setting up Staging environment..." -ForegroundColor Cyan
        $stagingToken = Get-StaticWebAppToken -AppName $StagingStaticWebAppName -ResourceGroup $ResourceGroupName
        if ($stagingToken) {
            $secrets["AZURE_STATIC_WEB_APPS_API_TOKEN_STAGING"] = $stagingToken
        } else {
            Write-Warning "Failed to get staging token. Skipping staging environment."
        }
    }

    # Production environment
    Write-Host "🏭 Setting up Production environment..." -ForegroundColor Cyan
    $prodToken = Get-StaticWebAppToken -AppName $ProductionStaticWebAppName -ResourceGroup $ResourceGroupName
    if ($prodToken) {
        $secrets["AZURE_STATIC_WEB_APPS_API_TOKEN_BRAVE_SMOKE_0CD316503"] = $prodToken
    } else {
        Write-Error "Failed to get production token. Exiting."
        exit 1
    }

    # Set all secrets in GitHub repository
    Write-Host ""
    Write-Host "🔐 Setting GitHub repository secrets..." -ForegroundColor Cyan
    
    $successCount = 0
    $totalSecrets = $secrets.Count
    
    foreach ($secret in $secrets.GetEnumerator()) {
        if (Set-GitHubSecret -SecretName $secret.Key -SecretValue $secret.Value -Owner $RepoOwner -Repo $RepoName -Token $GitHubToken) {
            $successCount++
        }
    }

    Write-Host ""
    if ($successCount -eq $totalSecrets) {
        Write-Host "🎉 Successfully configured all $totalSecrets repository secrets!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your multi-environment deployment is now configured:" -ForegroundColor White
        Write-Host "  🔧 Development: $DevStaticWebAppName (develop branch)" -ForegroundColor Blue
        if (-not [string]::IsNullOrEmpty($StagingStaticWebAppName)) {
            Write-Host "  🎭 Staging: $StagingStaticWebAppName (deploy branch)" -ForegroundColor Yellow
        }
        Write-Host "  🏭 Production: $ProductionStaticWebAppName (release branch)" -ForegroundColor Green
        Write-Host ""
        Write-Host "Branch deployment workflow:" -ForegroundColor White
        Write-Host "  • Push to 'develop' → Deploys to Development environment" -ForegroundColor Blue
        Write-Host "  • Push to 'deploy' → Deploys to Staging/Production environment" -ForegroundColor Yellow
        Write-Host "  • Push to 'release' → Deploys to Production environment" -ForegroundColor Green
        Write-Host "  • Manual trigger → Choose environment manually" -ForegroundColor Magenta
    } else {
        Write-Warning "⚠️  Some secrets failed to configure. $successCount/$totalSecrets successful."
        Write-Host "Please check the errors above and retry failed secrets manually." -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host "1. Commit and push your code to the develop branch to test development deployment" -ForegroundColor Gray
    Write-Host "2. Create a pull request from develop to deploy to test staging workflow" -ForegroundColor Gray
    Write-Host "3. Use the 'Deploy to Azure' button for manual deployments" -ForegroundColor Gray

} catch {
    Write-Error "An error occurred: $_"
    exit 1
} finally {
    # Clear the GitHub token from environment
    $env:GITHUB_TOKEN = $null
}
