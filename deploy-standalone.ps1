#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploys pre-built Group Tree Membership Visualizer files to Azure Static Web App
    
.DESCRIPTION
    This script downloads the latest pre-built release and deploys it to an existing
    Azure Static Web App without requiring GitHub integration.
    
.PARAMETER StaticWebAppName
    Name of the Azure Static Web App resource
    
.PARAMETER DeploymentToken
    Deployment token from Azure (get from ARM template output or Azure portal)
    
.PARAMETER ResourceGroupName
    Optional: Resource group name if different from default
    
.PARAMETER ReleaseVersion
    Optional: Specific release version to deploy (default: latest)
    
.EXAMPLE
    .\deploy-standalone.ps1 -StaticWebAppName "my-group-visualizer" -DeploymentToken "abc123..."
    
.EXAMPLE
    .\deploy-standalone.ps1 -StaticWebAppName "my-app" -DeploymentToken "abc123..." -ReleaseVersion "v1.1.0"
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$StaticWebAppName,
    
    [Parameter(Mandatory = $true)]
    [string]$DeploymentToken,
    
    [Parameter(Mandatory = $false)]
    [string]$ResourceGroupName = "",
    
    [Parameter(Mandatory = $false)]
    [string]$ReleaseVersion = "latest"
)

# Script configuration
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colors for output
$ColorInfo = "Cyan"
$ColorSuccess = "Green"
$ColorWarning = "Yellow"
$ColorError = "Red"

function Write-StyledOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-Prerequisites {
    Write-StyledOutput "🔍 Checking prerequisites..." $ColorInfo
    
    # Check if Azure CLI is installed
    try {
        $azVersion = az --version 2>$null
        if ($azVersion) {
            Write-StyledOutput "✅ Azure CLI found" $ColorSuccess
        }
    }
    catch {
        Write-StyledOutput "⚠️  Azure CLI not found - will use REST API method" $ColorWarning
    }
    
    # Check if PowerShell 5.1+ or PowerShell Core
    if ($PSVersionTable.PSVersion.Major -ge 5) {
        Write-StyledOutput "✅ PowerShell version supported: $($PSVersionTable.PSVersion)" $ColorSuccess
    }
    else {
        throw "❌ PowerShell 5.1 or higher required"
    }
}

function Get-LatestRelease {
    param([string]$Version)
    
    Write-StyledOutput "📦 Getting release information..." $ColorInfo
    
    try {
        if ($Version -eq "latest") {
            $apiUrl = "https://api.github.com/repos/OfirGavish/Group-Tree-Membership-Visualizer/releases/latest"
        }
        else {
            $apiUrl = "https://api.github.com/repos/OfirGavish/Group-Tree-Membership-Visualizer/releases/tags/$Version"
        }
        
        $headers = @{
            "User-Agent" = "Group-Tree-Deployment-Script"
            "Accept" = "application/vnd.github.v3+json"
        }
        
        $release = Invoke-RestMethod -Uri $apiUrl -Headers $headers
        
        # Look for the standalone deployment asset
        $asset = $release.assets | Where-Object { $_.name -like "*standalone*" -or $_.name -like "*static*" }
        
        if (-not $asset) {
            Write-StyledOutput "⚠️  No pre-built release found, downloading source..." $ColorWarning
            return @{
                Version = $release.tag_name
                DownloadUrl = $release.zipball_url
                IsPreBuilt = $false
            }
        }
        
        Write-StyledOutput "✅ Found release: $($release.tag_name)" $ColorSuccess
        return @{
            Version = $release.tag_name
            DownloadUrl = $asset.browser_download_url
            IsPreBuilt = $true
        }
    }
    catch {
        Write-StyledOutput "❌ Failed to get release information: $($_.Exception.Message)" $ColorError
        throw
    }
}

function Download-ReleaseFiles {
    param([hashtable]$ReleaseInfo)
    
    $tempDir = Join-Path $env:TEMP "group-tree-deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    
    Write-StyledOutput "⬇️  Downloading release files to: $tempDir" $ColorInfo
    
    try {
        $zipPath = Join-Path $tempDir "release.zip"
        
        # Download the release
        Invoke-WebRequest -Uri $ReleaseInfo.DownloadUrl -OutFile $zipPath -UseBasicParsing
        
        Write-StyledOutput "📁 Extracting files..." $ColorInfo
        
        # Extract the zip file
        Expand-Archive -Path $zipPath -DestinationPath $tempDir -Force
        
        # Find the extracted content directory
        $extractedDirs = Get-ChildItem -Path $tempDir -Directory
        $contentDir = $null
        
        if ($ReleaseInfo.IsPreBuilt) {
            # Look for pre-built static files
            $contentDir = $extractedDirs | Where-Object { $_.Name -like "*static*" -or $_.Name -like "*build*" -or $_.Name -like "*out*" } | Select-Object -First 1
        }
        else {
            # Source code - need to build
            $sourceDir = $extractedDirs | Select-Object -First 1
            $contentDir = Build-Application -SourcePath $sourceDir.FullName
        }
        
        if (-not $contentDir -or -not (Test-Path $contentDir.FullName)) {
            throw "Could not find or build application content"
        }
        
        Write-StyledOutput "✅ Files ready for deployment: $($contentDir.FullName)" $ColorSuccess
        return $contentDir.FullName
    }
    catch {
        Write-StyledOutput "❌ Failed to download/extract files: $($_.Exception.Message)" $ColorError
        throw
    }
}

function Build-Application {
    param([string]$SourcePath)
    
    Write-StyledOutput "🔨 Building application from source..." $ColorInfo
    
    # This is a fallback - in practice, we should have pre-built releases
    # But if needed, we can build from source
    
    $buildDir = Join-Path $SourcePath "out"
    
    try {
        Push-Location $SourcePath
        
        # Check if package.json exists
        if (Test-Path "package.json") {
            Write-StyledOutput "📦 Installing dependencies..." $ColorInfo
            npm install --silent
            
            Write-StyledOutput "🏗️  Building application..." $ColorInfo
            npm run build
            
            if (Test-Path "out") {
                Write-StyledOutput "✅ Build completed successfully" $ColorSuccess
                return Get-Item "out"
            }
            else {
                throw "Build output directory not found"
            }
        }
        else {
            throw "No package.json found in source directory"
        }
    }
    catch {
        Write-StyledOutput "❌ Build failed: $($_.Exception.Message)" $ColorError
        throw
    }
    finally {
        Pop-Location
    }
}

function Deploy-ToStaticWebApp {
    param(
        [string]$ContentPath,
        [string]$AppName,
        [string]$Token
    )
    
    Write-StyledOutput "🚀 Deploying to Azure Static Web App: $AppName" $ColorInfo
    
    try {
        # Try Azure CLI first
        $azInstalled = Get-Command az -ErrorAction SilentlyContinue
        
        if ($azInstalled) {
            Write-StyledOutput "📤 Using Azure CLI for deployment..." $ColorInfo
            
            # Use Azure Static Web Apps CLI if available, otherwise use REST API
            $swaInstalled = Get-Command swa -ErrorAction SilentlyContinue
            
            if ($swaInstalled) {
                Write-StyledOutput "Using SWA CLI..." $ColorInfo
                swa deploy $ContentPath --deployment-token $Token --verbose
            }
            else {
                Write-StyledOutput "Using Azure CLI..." $ColorInfo
                az staticwebapp deploy --source $ContentPath --deployment-token $Token
            }
        }
        else {
            # Fallback to REST API
            Write-StyledOutput "📤 Using REST API for deployment..." $ColorInfo
            Deploy-ViaRestAPI -ContentPath $ContentPath -Token $Token
        }
        
        Write-StyledOutput "✅ Deployment completed successfully!" $ColorSuccess
    }
    catch {
        Write-StyledOutput "❌ Deployment failed: $($_.Exception.Message)" $ColorError
        throw
    }
}

function Deploy-ViaRestAPI {
    param(
        [string]$ContentPath,
        [string]$Token
    )
    
    # Create a zip of the content
    $zipPath = Join-Path $env:TEMP "static-content.zip"
    
    Write-StyledOutput "📦 Creating deployment package..." $ColorInfo
    Compress-Archive -Path "$ContentPath\*" -DestinationPath $zipPath -Force
    
    # Upload via REST API
    $apiUrl = "https://api.azurestaticapps.net/api/v1/sites/$StaticWebAppName"
    
    $headers = @{
        "Authorization" = "Bearer $Token"
        "Content-Type" = "application/zip"
    }
    
    Write-StyledOutput "📤 Uploading to Azure..." $ColorInfo
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Headers $headers -InFile $zipPath
    
    Write-StyledOutput "✅ Upload completed" $ColorSuccess
}

function Show-PostDeploymentInstructions {
    param([string]$AppName)
    
    $appUrl = "https://$AppName.azurestaticapps.net"
    
    Write-StyledOutput "`n🎉 Deployment Complete!" $ColorSuccess
    Write-StyledOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" $ColorSuccess
    
    Write-StyledOutput "`n📱 Your application is available at:" $ColorInfo
    Write-StyledOutput "   $appUrl" $ColorSuccess
    
    Write-StyledOutput "`n🔧 Next Steps:" $ColorInfo
    Write-StyledOutput "   1. Run the configuration script to set up MSAL:" $ColorWarning
    Write-StyledOutput "      Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/OfirGavish/Group-Tree-Membership-Visualizer/main/configure-app.ps1' -OutFile 'configure-app.ps1'" $ColorInfo
    Write-StyledOutput "      .\configure-app.ps1 -StaticWebAppName '$AppName'" $ColorInfo
    
    Write-StyledOutput "`n   2. Grant admin consent for Microsoft Graph permissions" $ColorWarning
    Write-StyledOutput "`n   3. Test the application with your users" $ColorWarning
    
    Write-StyledOutput "`n📚 Documentation:" $ColorInfo
    Write-StyledOutput "   https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/blob/main/README.md" $ColorInfo
    
    Write-StyledOutput "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" $ColorSuccess
}

# Main execution
try {
    Write-StyledOutput "🌳 Group Tree Membership Visualizer - Standalone Deployment" $ColorSuccess
    Write-StyledOutput "═══════════════════════════════════════════════════════════" $ColorSuccess
    
    Test-Prerequisites
    
    $releaseInfo = Get-LatestRelease -Version $ReleaseVersion
    $contentPath = Download-ReleaseFiles -ReleaseInfo $releaseInfo
    
    Deploy-ToStaticWebApp -ContentPath $contentPath -AppName $StaticWebAppName -Token $DeploymentToken
    
    Show-PostDeploymentInstructions -AppName $StaticWebAppName
}
catch {
    Write-StyledOutput "`n❌ Deployment failed: $($_.Exception.Message)" $ColorError
    Write-StyledOutput "💡 Try the manual deployment method or check the troubleshooting guide." $ColorWarning
    exit 1
}
