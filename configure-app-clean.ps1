#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Configures Azure AD App Registration and Static Web App for the Group Tree Membership Visualizer

.DESCRIPTION
    This script automates the setup of Azure AD app registration and configures the Static Web App
    with the necessary environment variables for authentication.

.PARAMETER AppName
    Name for the Azure AD application registration

.PARAMETER StaticWebAppName
    Name of the Static Web App to configure

.PARAMETER ResourceGroupName
    Resource Group containing the Static Web App

.PARAMETER TenantId
    Azure AD Tenant ID (will be auto-detected if not provided)

.PARAMETER ForceLogin
    Force a fresh Azure login to allow account selection

.EXAMPLE
    .\configure-app-clean.ps1 -StaticWebAppName "group-tree-dev"
#>

param(
    [Parameter(Mandatory = $false)]
    [string]$AppName = "Group Tree Membership Visualizer",
    
    [Parameter(Mandatory = $true)]
    [string]$StaticWebAppName,
    
    [Parameter(Mandatory = $false)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory = $false)]
    [string]$TenantId,
    
    [Parameter(Mandatory = $false)]
    [switch]$ForceLogin
)

Write-Host "Group Tree Membership Visualizer - Azure Configuration" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is available
Write-Host "Checking prerequisites..." -ForegroundColor Green
$azCliAvailable = $true
try {
    $azVersion = az version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Azure CLI: Available" -ForegroundColor Green
    } else {
        throw "Azure CLI not found"
    }
} catch {
    Write-Warning "Azure CLI not found. Environment variables will need to be set manually."
    $azCliAvailable = $false
}

# Connect to Azure
Write-Host "Connecting to Azure..." -ForegroundColor Green
try {
    $azContext = Get-AzContext
    
    # Check if we should force a fresh login or if no context exists
    if ($ForceLogin -or !$azContext) {
        if ($ForceLogin) {
            Write-Host "  Force login requested. Starting fresh authentication..." -ForegroundColor Blue
            # Clear existing context to force account selection
            Clear-AzContext -Force -ErrorAction SilentlyContinue
        } else {
            Write-Host "  No existing Azure context found. Initiating login..." -ForegroundColor Blue
        }
        
        # Force interactive login with account selection
        Connect-AzAccount -UseDeviceAuthentication:$false
        $azContext = Get-AzContext
    } else {
        Write-Host "  Using existing Azure context for: $($azContext.Account)" -ForegroundColor Green
        Write-Host "  Use -ForceLogin parameter to choose a different account" -ForegroundColor Yellow
    }
    
    if ($azContext) {
        Write-Host "Connected to Azure as: $($azContext.Account)" -ForegroundColor Green
    } else {
        throw "Failed to establish Azure context"
    }
} catch {
    Write-Error "Failed to connect to Azure: $($_.Exception.Message)"
    Write-Host "Please ensure you have appropriate permissions and try running Connect-AzAccount manually." -ForegroundColor Yellow
    exit 1
}

# Get tenant ID if not provided
if (!$TenantId) {
    $TenantId = (Get-AzContext).Tenant.Id
    Write-Host "Using tenant ID: $TenantId" -ForegroundColor Blue
}

# Get Static Web App details
Write-Host "Getting Static Web App details..." -ForegroundColor Green
try {
    if (!$ResourceGroupName) {
        # Try to find the Static Web App in any resource group
        $swa = Get-AzStaticWebApp | Where-Object { $_.Name -eq $StaticWebAppName }
        if ($swa) {
            $ResourceGroupName = $swa.ResourceGroupName
        } else {
            throw "Static Web App '$StaticWebAppName' not found in any resource group"
        }
    } else {
        $swa = Get-AzStaticWebApp -ResourceGroupName $ResourceGroupName -Name $StaticWebAppName
    }
    
    $appUrl = "https://$($swa.DefaultHostName)"
    Write-Host "  Static Web App: $StaticWebAppName" -ForegroundColor Blue
    Write-Host "  Resource Group: $ResourceGroupName" -ForegroundColor Blue
    Write-Host "  URL: $appUrl" -ForegroundColor Blue
} catch {
    Write-Error "Failed to get Static Web App details: $($_.Exception.Message)"
    exit 1
}

# Check if Azure AD app already exists
Write-Host "Checking for existing Azure AD app registration..." -ForegroundColor Green
try {
    $existingApp = Get-AzADApplication -DisplayName $AppName -ErrorAction SilentlyContinue
    if ($existingApp) {
        Write-Host "  Found existing app registration: $($existingApp.DisplayName)" -ForegroundColor Yellow
        $app = $existingApp
        $appIdValue = $app.AppId
    } else {
        Write-Host "  No existing app found. Creating new registration..." -ForegroundColor Blue
        $app = $null
    }
} catch {
    Write-Host "  Unable to check for existing app. Will create new one..." -ForegroundColor Yellow
    $app = $null
}

# Create or update Azure AD App Registration
if (!$app) {
    Write-Host "Creating Azure AD App Registration..." -ForegroundColor Green
    try {
        $redirectUris = @($appUrl, "$appUrl/")
        
        $app = New-AzADApplication -DisplayName $AppName `
            -Web @{ RedirectUri = $redirectUris } `
            -RequiredResourceAccess @{
                ResourceAppId = "00000003-0000-0000-c000-000000000000"  # Microsoft Graph
                ResourceAccess = @(
                    @{ Id = "e1fe6dd8-ba31-4d61-89e7-88639da4683d"; Type = "Scope" },  # User.Read
                    @{ Id = "62a82d76-70ea-41e2-9197-370581804d09"; Type = "Role" },   # Group.Read.All
                    @{ Id = "7ab1d382-f21e-4acd-a863-ba3e13f7da61"; Type = "Role" },   # Directory.Read.All
                    @{ Id = "bc024368-1153-4739-b217-4326f2e966d0"; Type = "Role" }    # GroupMember.Read.All
                )
            }
        
        $appIdValue = $app.AppId
        Write-Host "  App ID: $appIdValue" -ForegroundColor Green
    } catch {
        Write-Error "Failed to create Azure AD app: $($_.Exception.Message)"
        exit 1
    }
} else {
    $appIdValue = $app.AppId
    Write-Host "Using existing app ID: $appIdValue" -ForegroundColor Green
}

# Create client secret
Write-Host "Creating client secret..." -ForegroundColor Green
try {
    $passwordCred = @{
        DisplayName = "Group Tree Visualizer Secret"
        EndDateTime = (Get-Date).AddMonths(6)
    }
    
    $clientSecret = New-AzADAppCredential -ApplicationId $appIdValue -PasswordCredential $passwordCred
    Write-Host "  Client secret created (expires: $($passwordCred.EndDateTime.ToString('yyyy-MM-dd')))" -ForegroundColor Green
} catch {
    Write-Error "Failed to create client secret: $($_.Exception.Message)"
    exit 1
}

# Configure Static Web App environment variables
Write-Host "Configuring Static Web App environment variables..." -ForegroundColor Green

$appSettings = @{
    "ENTRA_CLIENT_ID" = $appIdValue
    "ENTRA_TENANT_ID" = $TenantId
    "ENTRA_CLIENT_SECRET" = $clientSecret.SecretText
    "AZURE_CLIENT_ID" = $appIdValue  # Keeping for backward compatibility
    "AZURE_CLIENT_SECRET" = $clientSecret.SecretText  # Keeping for backward compatibility
    "AZURE_TENANT_ID" = $TenantId
}

try {
    if ($azCliAvailable) {
        # Use Azure CLI for setting Static Web App settings as it's more reliable
        Write-Host "  Setting environment variables using Azure CLI..." -ForegroundColor Blue
        
        foreach ($setting in $appSettings.GetEnumerator()) {
            $settingString = "$($setting.Key)=$($setting.Value)"
            $result = az staticwebapp appsettings set --name $StaticWebAppName --resource-group $ResourceGroupName --setting-names $settingString 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "    Set $($setting.Key)" -ForegroundColor Green
            } else {
                Write-Warning "    Failed to set $($setting.Key)"
            }
        }
        Write-Host "Environment variables configured" -ForegroundColor Green
    } else {
        throw "Azure CLI not available"
    }
} catch {
    Write-Warning "Failed to set environment variables automatically. Please set them manually using Azure CLI:"
    foreach ($setting in $appSettings.GetEnumerator()) {
        if ($setting.Key -like "*SECRET*") {
            Write-Host "  az staticwebapp appsettings set --name `"$StaticWebAppName`" --resource-group `"$ResourceGroupName`" --setting-names `"$($setting.Key)=[HIDDEN]`"" -ForegroundColor Yellow
        } else {
            Write-Host "  az staticwebapp appsettings set --name `"$StaticWebAppName`" --resource-group `"$ResourceGroupName`" --setting-names `"$($setting.Key)=$($setting.Value)`"" -ForegroundColor Yellow
        }
    }
}

# Test configuration
Write-Host "Testing configuration..." -ForegroundColor Green
try {
    $testUrl = "$appUrl/api/debug"
    $response = Invoke-RestMethod -Uri $testUrl -Method Get -TimeoutSec 30
    
    if ($response.authenticated) {
        Write-Host "Configuration test passed!" -ForegroundColor Green
    } else {
        Write-Host "Configuration test inconclusive. Check manually at: $testUrl" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Configuration test failed. Please check manually at: $appUrl/api/debug" -ForegroundColor Yellow
}

# Display summary
Write-Host ""
Write-Host "Configuration Summary" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host "App Name: $AppName" -ForegroundColor White
Write-Host "App ID: $appIdValue" -ForegroundColor White
Write-Host "Tenant ID: $TenantId" -ForegroundColor White
Write-Host "Static Web App: $StaticWebAppName" -ForegroundColor White
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor White
Write-Host "URL: $appUrl" -ForegroundColor White
Write-Host ""

# Save configuration to file
$configFile = ".\configuration-summary.txt"
$configContent = "Group Tree Membership Visualizer Configuration`n"
$configContent += "================================================`n`n"
$configContent += "Generated: $(Get-Date)`n`n"
$configContent += "Azure AD Application:`n"
$configContent += "- Name: $AppName`n"
$configContent += "- App ID: $appIdValue`n"
$configContent += "- Tenant ID: $TenantId`n`n"
$configContent += "Static Web App:`n"
$configContent += "- Name: $StaticWebAppName`n"
$configContent += "- Resource Group: $ResourceGroupName`n"
$configContent += "- Application URL: $appUrl`n"
$configContent += "- Setup Guide: https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/blob/main/SETUP_GUIDE.md`n"
$configContent += "- Troubleshooting: https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/blob/main/TROUBLESHOOTING.md`n`n"
$configContent += "Manual Configuration Commands:`n"
$configContent += "az staticwebapp appsettings set --name `"$StaticWebAppName`" --resource-group `"$ResourceGroupName`" --setting-names AZURE_CLIENT_ID=`"$appIdValue`" AZURE_CLIENT_SECRET=`"your-secret`" AZURE_TENANT_ID=`"$TenantId`"`n"

$configContent | Out-File -FilePath $configFile -Encoding UTF8
Write-Host "Configuration details saved to: $configFile" -ForegroundColor Blue

Write-Host ""
Write-Host "Your Group Tree Membership Visualizer is ready to use!" -ForegroundColor Cyan
Write-Host "   Visit: $appUrl" -ForegroundColor Green
Write-Host ""
