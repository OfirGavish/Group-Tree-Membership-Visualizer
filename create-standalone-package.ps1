#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Creates a standalone deployment package for Group Tree Membership Visualizer
    
.DESCRIPTION
    This script builds the application and creates a deployment package that can be
    deployed to Azure Static Web Apps without GitHub integration.
    
.PARAMETER OutputPath
    Directory to create the deployment package (default: ./dist)
    
.PARAMETER IncludeSource
    Include source code in the package for debugging
    
.PARAMETER Version
    Version string to include in the package
    
.EXAMPLE
    .\create-standalone-package.ps1
    
.EXAMPLE
    .\create-standalone-package.ps1 -OutputPath "./release" -Version "v1.1.0"
#>

param(
    [Parameter(Mandatory = $false)]
    [string]$OutputPath = "./dist",
    
    [Parameter(Mandatory = $false)]
    [switch]$IncludeSource,
    
    [Parameter(Mandatory = $false)]
    [string]$Version = "latest"
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

function Test-BuildEnvironment {
    Write-StyledOutput "🔍 Checking build environment..." $ColorInfo
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-StyledOutput "✅ Node.js found: $nodeVersion" $ColorSuccess
    }
    catch {
        throw "❌ Node.js is required but not found"
    }
    
    # Check npm
    try {
        $npmVersion = npm --version
        Write-StyledOutput "✅ npm found: v$npmVersion" $ColorSuccess
    }
    catch {
        throw "❌ npm is required but not found"
    }
    
    # Check if we're in the right directory
    if (-not (Test-Path "package.json")) {
        throw "❌ package.json not found. Please run this script from the project root directory."
    }
    
    Write-StyledOutput "✅ Build environment ready" $ColorSuccess
}

function Install-Dependencies {
    Write-StyledOutput "📦 Installing dependencies..." $ColorInfo
    
    try {
        npm ci --silent
        Write-StyledOutput "✅ Dependencies installed" $ColorSuccess
    }
    catch {
        Write-StyledOutput "❌ Failed to install dependencies: $($_.Exception.Message)" $ColorError
        throw
    }
}

function Build-Application {
    Write-StyledOutput "🏗️  Building application..." $ColorInfo
    
    try {
        # Clean previous builds
        if (Test-Path "out") {
            Remove-Item "out" -Recurse -Force
        }
        
        if (Test-Path ".next") {
            Remove-Item ".next" -Recurse -Force
        }
        
        # Build the application
        npm run build
        
        # Verify build output
        if (-not (Test-Path "out")) {
            throw "Build output directory 'out' not found"
        }
        
        $buildFiles = Get-ChildItem "out" -Recurse -File
        Write-StyledOutput "✅ Build completed successfully ($($buildFiles.Count) files generated)" $ColorSuccess
    }
    catch {
        Write-StyledOutput "❌ Build failed: $($_.Exception.Message)" $ColorError
        throw
    }
}

function Create-DeploymentPackage {
    param([string]$OutputDir, [string]$Version, [bool]$IncludeSource)
    
    Write-StyledOutput "📦 Creating deployment package..." $ColorInfo
    
    try {
        # Create output directory
        if (Test-Path $OutputDir) {
            Remove-Item $OutputDir -Recurse -Force
        }
        New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
        
        # Create package structure
        $packageDir = Join-Path $OutputDir "group-tree-visualizer-standalone-$Version"
        New-Item -ItemType Directory -Path $packageDir -Force | Out-Null
        
        # Copy built static files
        $staticDir = Join-Path $packageDir "static"
        Copy-Item "out" $staticDir -Recurse -Force
        
        # Copy API functions
        $apiDir = Join-Path $packageDir "api"
        Copy-Item "api" $apiDir -Recurse -Force
        
        # Copy configuration files
        Copy-Item "staticwebapp.config.json" $packageDir -Force
        if (Test-Path "public/staticwebapp.config.json") {
            Copy-Item "public/staticwebapp.config.json" (Join-Path $packageDir "static") -Force
        }
        
        # Copy essential documentation
        Copy-Item "README.md" $packageDir -Force
        Copy-Item "CONFIGURATION.md" $packageDir -Force -ErrorAction SilentlyContinue
        Copy-Item "TROUBLESHOOTING.md" $packageDir -Force -ErrorAction SilentlyContinue
        
        # Copy deployment scripts
        Copy-Item "configure-app.ps1" $packageDir -Force -ErrorAction SilentlyContinue
        Copy-Item "deploy-standalone.ps1" $packageDir -Force -ErrorAction SilentlyContinue
        
        # Create deployment instructions
        $deployInstructions = @"
# Group Tree Membership Visualizer - Standalone Deployment Package

This package contains pre-built static files ready for deployment to Azure Static Web Apps.

## Quick Deployment

1. **Deploy Infrastructure** (if not already done):
   - Use the Deploy to Azure button in README.md
   - Or manually create an Azure Static Web App resource

2. **Deploy Application Files**:
   ``````powershell
   # Get your deployment token from Azure portal or ARM template output
   `$deploymentToken = "your-deployment-token-here"
   
   # Deploy using Azure CLI (recommended)
   az staticwebapp deploy --source "./static" --deployment-token `$deploymentToken
   
   # OR use the deployment script
   .\deploy-standalone.ps1 -StaticWebAppName "your-app-name" -DeploymentToken `$deploymentToken
   ``````

3. **Configure MSAL Authentication**:
   ``````powershell
   .\configure-app.ps1 -StaticWebAppName "your-app-name"
   ``````

4. **Test the Application**:
   - Visit your app URL: https://your-app-name.azurestaticapps.net
   - Sign in with your organizational account
   - Start exploring group memberships!

## Package Contents

- `/static` - Pre-built Next.js static files ready for deployment
- `/api` - Azure Functions for backend API
- `staticwebapp.config.json` - Azure Static Web Apps configuration
- `configure-app.ps1` - MSAL configuration script
- `deploy-standalone.ps1` - Alternative deployment script
- Documentation files

## Version Information

- Package Version: $Version
- Build Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
- Build Environment: PowerShell $($PSVersionTable.PSVersion)

## Support

For issues and documentation, see:
https://github.com/OfirGavish/Group-Tree-Membership-Visualizer
"@
        
        Set-Content -Path (Join-Path $packageDir "DEPLOYMENT.md") -Value $deployInstructions
        
        # Include source code if requested
        if ($IncludeSource) {
            Write-StyledOutput "📄 Including source code..." $ColorInfo
            $sourceDir = Join-Path $packageDir "source"
            New-Item -ItemType Directory -Path $sourceDir -Force | Out-Null
            
            # Copy source files (excluding build artifacts and node_modules)
            $excludePatterns = @("node_modules", "out", ".next", "dist", ".git")
            
            Get-ChildItem -Path "." -File | Where-Object { 
                $_.Name -notlike ".*" -and $_.Extension -in @(".js", ".ts", ".tsx", ".json", ".md", ".ps1")
            } | Copy-Item -Destination $sourceDir
            
            Get-ChildItem -Path "." -Directory | Where-Object { 
                $_.Name -notin $excludePatterns 
            } | Copy-Item -Destination $sourceDir -Recurse
        }
        
        # Create ZIP package
        $zipPath = Join-Path $OutputDir "group-tree-visualizer-standalone-$Version.zip"
        Compress-Archive -Path $packageDir -DestinationPath $zipPath -Force
        
        Write-StyledOutput "✅ Deployment package created:" $ColorSuccess
        Write-StyledOutput "   Directory: $packageDir" $ColorInfo
        Write-StyledOutput "   ZIP file: $zipPath" $ColorInfo
        
        # Calculate package size
        $zipSize = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
        Write-StyledOutput "   Package size: $zipSize MB" $ColorInfo
        
        return @{
            PackageDir = $packageDir
            ZipPath = $zipPath
            Size = $zipSize
        }
    }
    catch {
        Write-StyledOutput "❌ Failed to create package: $($_.Exception.Message)" $ColorError
        throw
    }
}

function Show-PackageInfo {
    param([hashtable]$PackageInfo, [string]$Version)
    
    Write-StyledOutput "`n🎉 Package Creation Complete!" $ColorSuccess
    Write-StyledOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" $ColorSuccess
    
    Write-StyledOutput "`n📦 Package Information:" $ColorInfo
    Write-StyledOutput "   Version: $Version" $ColorSuccess
    Write-StyledOutput "   Size: $($PackageInfo.Size) MB" $ColorSuccess
    Write-StyledOutput "   Location: $($PackageInfo.ZipPath)" $ColorSuccess
    
    Write-StyledOutput "`n🚀 Deployment Options:" $ColorInfo
    Write-StyledOutput "   1. Use Deploy to Azure button for infrastructure:" $ColorWarning
    Write-StyledOutput "      https://portal.azure.com/#create/Microsoft.Template/uri/..." $ColorInfo
    
    Write-StyledOutput "`n   2. Deploy using Azure CLI:" $ColorWarning
    Write-StyledOutput "      az staticwebapp deploy --source ""$($PackageInfo.PackageDir)/static"" --deployment-token ""YOUR_TOKEN""" $ColorInfo
    
    Write-StyledOutput "`n   3. Use the deployment script:" $ColorWarning
    Write-StyledOutput "      .\deploy-standalone.ps1 -StaticWebAppName ""your-app"" -DeploymentToken ""YOUR_TOKEN""" $ColorInfo
    
    Write-StyledOutput "`n📚 Next Steps:" $ColorInfo
    Write-StyledOutput "   1. Create Azure Static Web App (if not done)" $ColorWarning
    Write-StyledOutput "   2. Deploy the package contents" $ColorWarning
    Write-StyledOutput "   3. Run configure-app.ps1 for MSAL setup" $ColorWarning
    Write-StyledOutput "   4. Test with your organization's users" $ColorWarning
    
    Write-StyledOutput "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" $ColorSuccess
}

# Main execution
try {
    Write-StyledOutput "🌳 Group Tree Membership Visualizer - Package Builder" $ColorSuccess
    Write-StyledOutput "═══════════════════════════════════════════════════════" $ColorSuccess
    
    Test-BuildEnvironment
    Install-Dependencies
    Build-Application
    
    $packageInfo = Create-DeploymentPackage -OutputDir $OutputPath -Version $Version -IncludeSource $IncludeSource
    
    Show-PackageInfo -PackageInfo $packageInfo -Version $Version
}
catch {
    Write-StyledOutput "`n❌ Package creation failed: $($_.Exception.Message)" $ColorError
    Write-StyledOutput "💡 Check the build environment and try again." $ColorWarning
    exit 1
}
