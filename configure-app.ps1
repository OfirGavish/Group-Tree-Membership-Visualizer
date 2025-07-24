# Group Tree Membership Visualizer - Post-Deployment Configuration Script
# This script configures the Azure app registration and sets up Microsoft Graph permissions

param(
    [Parameter(Mandatory=$true, HelpMessage="Name of your Azure Static Web App")]
    [string]$StaticWebAppName,
    
    [Parameter(Mandatory=$false, HelpMessage="Your Azure Tenant ID")]
    [string]$TenantId,
    
    [Parameter(Mandatory=$false, HelpMessage="Resource Group containing the Static Web App")]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$false, HelpMessage="Skip admin consent (if you're not a Global Admin)")]
    [switch]$SkipAdminConsent,
    
    [Parameter(Mandatory=$false, HelpMessage="Force a fresh login to Azure (allows you to choose account)")]
    [switch]$ForceLogin
)

Write-Host "🚀 Group Tree Membership Visualizer - Configuration Script" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Check if required modules are installed
$requiredModules = @('Microsoft.Graph', 'Az.Accounts', 'Az.Resources', 'Az.Websites')
foreach ($module in $requiredModules) {
    if (!(Get-Module -ListAvailable -Name $module)) {
        Write-Host "❌ Required module '$module' not found. Installing..." -ForegroundColor Yellow
        Install-Module -Name $module -Force -AllowClobber -Scope CurrentUser
    }
}

# Check if Azure CLI is available for setting Static Web App environment variables
try {
    $azVersion = az version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "⚠️  Azure CLI not found. Environment variables will need to be set manually."
        $azCliAvailable = $false
    } else {
        Write-Host "✅ Azure CLI is available" -ForegroundColor Green
        $azCliAvailable = $true
    }
} catch {
    Write-Warning "⚠️  Azure CLI not found. Environment variables will need to be set manually."
    $azCliAvailable = $false
}

# Connect to Azure
Write-Host "🔐 Connecting to Azure..." -ForegroundColor Green
try {
    $azContext = Get-AzContext
    
    # Check if we should force a fresh login or if no context exists
    if ($ForceLogin -or !$azContext) {
        if ($ForceLogin) {
            Write-Host "  🔄 Force login requested. Starting fresh authentication..." -ForegroundColor Blue
            # Clear existing context to force account selection
            Clear-AzContext -Force -ErrorAction SilentlyContinue
        } else {
            Write-Host "  📝 No existing Azure context found. Initiating login..." -ForegroundColor Blue
        }
        
        # Force interactive login with account selection
        Connect-AzAccount -UseDeviceAuthentication:$false
        $azContext = Get-AzContext
    } else {
        Write-Host "  ✅ Using existing Azure context for: $($azContext.Account)" -ForegroundColor Green
        Write-Host "  💡 Use -ForceLogin parameter to choose a different account" -ForegroundColor Yellow
    }
    
    if ($azContext) {
        Write-Host "✅ Connected to Azure as: $($azContext.Account)" -ForegroundColor Green
    } else {
        throw "Failed to establish Azure context"
    }
} catch {
    Write-Error "❌ Failed to connect to Azure: $($_.Exception.Message)"
    Write-Host "💡 Please ensure you have appropriate permissions and try running Connect-AzAccount manually." -ForegroundColor Yellow
    exit 1
}

# Get tenant ID if not provided
if (!$TenantId) {
    $TenantId = (Get-AzContext).Tenant.Id
    Write-Host "📋 Using Tenant ID: $TenantId" -ForegroundColor Blue
}

# Connect to Microsoft Graph
Write-Host "🔐 Connecting to Microsoft Graph..." -ForegroundColor Green
try {
    $graphContext = Get-MgContext
    if (!$graphContext -or $graphContext.TenantId -ne $TenantId) {
        Connect-MgGraph -TenantId $TenantId -Scopes "Application.ReadWrite.All", "Directory.ReadWrite.All" -NoWelcome
    }
    Write-Host "✅ Connected to Microsoft Graph" -ForegroundColor Green
} catch {
    Write-Error "❌ Failed to connect to Microsoft Graph: $($_.Exception.Message)"
    exit 1
}

# Get Static Web App details
Write-Host "🔍 Finding Static Web App: $StaticWebAppName..." -ForegroundColor Green
try {
    if ($ResourceGroupName) {
        $staticWebApp = Get-AzStaticWebApp -ResourceGroupName $ResourceGroupName -Name $StaticWebAppName -ErrorAction SilentlyContinue
    } else {
        $staticWebApps = Get-AzStaticWebApp -ErrorAction SilentlyContinue
        $staticWebApp = $staticWebApps | Where-Object { $_.Name -eq $StaticWebAppName }
        if ($staticWebApp) {
            $ResourceGroupName = $staticWebApp.ResourceGroupName
        }
    }
    
    if (!$staticWebApp) {
        Write-Error "❌ Static Web App '$StaticWebAppName' not found. Please verify the name and ensure you have access to it."
        exit 1
    }
    
    $appUrl = "https://$($staticWebApp.DefaultHostname)"
    Write-Host "✅ Found Static Web App: $appUrl" -ForegroundColor Green
} catch {
    Write-Error "❌ Failed to find Static Web App: $($_.Exception.Message)"
    Write-Host "💡 Make sure you have the Az.Websites module installed and you're authenticated to Azure." -ForegroundColor Yellow
    exit 1
}

# Create or find app registration
$appDisplayName = "Group Tree Membership Visualizer"
Write-Host "🔍 Checking for existing app registration..." -ForegroundColor Green

$existingApp = Get-MgApplication -Filter "displayName eq '$appDisplayName'"

if ($existingApp) {
    Write-Host "✅ Found existing app registration: $($existingApp.AppId)" -ForegroundColor Green
    $app = $existingApp
} else {
    Write-Host "📝 Creating new Single-tenant SPA app registration..." -ForegroundColor Green
    
    # Create app registration as Single Page Application (SPA) for MSAL.js
    $appParams = @{
        DisplayName = $appDisplayName
        SignInAudience = "AzureADMyOrg"  # Single tenant only
        Spa = @{
            RedirectUris = @(
                $appUrl,
                "$appUrl/",
                "http://localhost:3000",
                "https://localhost:3000"
            )
        }
        RequiredResourceAccess = @()  # Will be set later
    }
    
    $app = New-MgApplication @appParams
    Write-Host "✅ Created Single-tenant SPA app registration: $($app.AppId)" -ForegroundColor Green
    Write-Host "  📋 Configured as Single Page Application with PKCE support" -ForegroundColor Blue
}

# Note: MSAL Single Page Applications use PKCE and don't require client secrets
Write-Host "🔐 MSAL SPA Configuration: No client secret needed (using PKCE)" -ForegroundColor Green
Write-Host "  📋 Single Page Applications use Proof Key for Code Exchange (PKCE) for security" -ForegroundColor Blue

# Update configuration files with tenant ID
Write-Host "⚙️  Updating configuration files with tenant ID..." -ForegroundColor Green
try {
    # Update staticwebapp.config.json
    $configFiles = @(
        "staticwebapp.config.json",
        "public/staticwebapp.config.json"
    )
    
    foreach ($configFile in $configFiles) {
        if (Test-Path $configFile) {
            $content = Get-Content $configFile -Raw
            $updatedContent = $content -replace '\{\{TENANT_ID\}\}', $TenantId
            Set-Content $configFile -Value $updatedContent -NoNewline
            Write-Host "  ✅ Updated $configFile" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Configuration file not found: $configFile" -ForegroundColor Yellow
        }
    }
    
    Write-Host "✅ Configuration files updated with tenant ID: $TenantId" -ForegroundColor Green
} catch {
    Write-Warning "⚠️  Failed to update configuration files: $($_.Exception.Message)"
}

# Required Microsoft Graph permissions for MSAL delegated access only
$requiredDelegatedPermissions = @(
    @{ Value = "User.Read"; Type = "Scope" },
    @{ Value = "User.Read.All"; Type = "Scope" },
    @{ Value = "Group.Read.All"; Type = "Scope" },
    @{ Value = "Directory.Read.All"; Type = "Scope" },
    @{ Value = "Device.Read.All"; Type = "Scope" }
)

Write-Host "🔐 Configuring Microsoft Graph delegated permissions for MSAL..." -ForegroundColor Green

# Get Microsoft Graph service principal
$graphServicePrincipal = Get-MgServicePrincipal -Filter "appId eq '00000003-0000-0000-c000-000000000000'"

# Update app registration to support SPA platform for MSAL.js
Write-Host "🌐 Updating app registration for Single Page Application platform..." -ForegroundColor Green
try {
    # Add SPA platform redirect URIs for MSAL.js
    $redirectUris = @(
        $appUrl,
        "$appUrl/",
        "http://localhost:3000",
        "https://localhost:3000"
    )
    
    # Update the application to support SPA platform
    $spaParams = @{
        ApplicationId = $app.Id
        Spa = @{
            RedirectUris = $redirectUris
        }
    }
    Update-MgApplication @spaParams
    Write-Host "✅ SPA platform configured with redirect URIs for MSAL.js" -ForegroundColor Green
    Write-Host "  📋 Configured URIs: $($redirectUris -join ', ')" -ForegroundColor Blue
} catch {
    Write-Warning "⚠️  Failed to update SPA platform configuration: $($_.Exception.Message)"
}

# Add Microsoft Graph API permissions (delegated only for MSAL)
Write-Host "🔐 Configuring Microsoft Graph API delegated permissions..." -ForegroundColor Green
try {
    # Build required resource access for Microsoft Graph
    $requiredResourceAccess = @()
    
    # Add delegated permissions (scopes) only
    $delegatedPermissions = @()
    foreach ($permission in $requiredDelegatedPermissions) {
        $oauth2Permission = $graphServicePrincipal.Oauth2PermissionScopes | Where-Object {$_.Value -eq $permission.Value}
        if ($oauth2Permission) {
            $delegatedPermissions += @{
                Id = $oauth2Permission.Id
                Type = "Scope"
            }
            Write-Host "  ✅ Will request delegated permission: $($permission.Value)" -ForegroundColor Green
        }
    }
    
    if ($delegatedPermissions.Count -gt 0) {
        $requiredResourceAccess += @{
            ResourceAppId = "00000003-0000-0000-c000-000000000000"  # Microsoft Graph
            ResourceAccess = $delegatedPermissions
        }
        
        # Update the application with required permissions
        $updateParams = @{
            ApplicationId = $app.Id
            RequiredResourceAccess = $requiredResourceAccess
        }
        Update-MgApplication @updateParams
        Write-Host "✅ Microsoft Graph API delegated permissions configured" -ForegroundColor Green
        Write-Host "  📋 Note: Only delegated permissions are used for MSAL SPA authentication" -ForegroundColor Blue
    }
} catch {
    Write-Warning "⚠️  Failed to configure API permissions: $($_.Exception.Message)"
}

# Grant admin consent if not skipped
if (!$SkipAdminConsent) {
    Write-Host "🔐 Attempting to grant admin consent..." -ForegroundColor Green
    try {
        # Try to grant admin consent
        $consentUrl = "https://login.microsoftonline.com/$TenantId/adminconsent?client_id=$($app.AppId)"
        Write-Host "  📝 Admin consent URL: $consentUrl" -ForegroundColor Blue
        
        # Open browser for admin consent
        Start-Process $consentUrl
        
        Write-Host "  ⏳ Please complete admin consent in your browser..." -ForegroundColor Yellow
        Read-Host "  ⌨️  Press Enter after completing admin consent"
        
        Write-Host "✅ Admin consent process initiated" -ForegroundColor Green
    } catch {
        Write-Warning "⚠️  Could not automatically grant admin consent. Please grant manually via Azure Portal."
    }
} else {
    Write-Host "⏭️  Skipping admin consent (use -SkipAdminConsent:$false to enable)" -ForegroundColor Yellow
}

# Configure Static Web App environment variables for MSAL
Write-Host "⚙️  Configuring Static Web App environment variables for MSAL..." -ForegroundColor Green

$appSettings = @{
    "NEXT_PUBLIC_AZURE_CLIENT_ID" = $app.AppId  # Public variable for MSAL.js frontend
    "AZURE_TENANT_ID" = $TenantId               # Tenant ID for MSAL configuration
    # Note: No client secret needed for MSAL SPA with PKCE
}

try {
    if ($azCliAvailable) {
        # Use Azure CLI for setting Static Web App settings as it's more reliable
        Write-Host "  🔧 Setting MSAL environment variables using Azure CLI..." -ForegroundColor Blue
        
        foreach ($setting in $appSettings.GetEnumerator()) {
            $settingString = "$($setting.Key)=$($setting.Value)"
            $result = az staticwebapp appsettings set --name $StaticWebAppName --resource-group $ResourceGroupName --setting-names $settingString 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "    ✅ Set $($setting.Key)" -ForegroundColor Green
            } else {
                Write-Warning "    ⚠️  Failed to set $($setting.Key)"
            }
        }
        Write-Host "✅ MSAL environment variables configured" -ForegroundColor Green
        Write-Host "  📋 Note: MSAL SPA uses PKCE - no client secret required" -ForegroundColor Blue
    } else {
        throw "Azure CLI not available"
    }
} catch {
    Write-Warning "⚠️  Failed to set environment variables automatically. Please set them manually using Azure CLI:"
    foreach ($setting in $appSettings.GetEnumerator()) {
        Write-Host "  az staticwebapp appsettings set --name `"$StaticWebAppName`" --resource-group `"$ResourceGroupName`" --setting-names `"$($setting.Key)=$($setting.Value)`"" -ForegroundColor Yellow
    }
}

# Test configuration
Write-Host "🧪 Testing configuration..." -ForegroundColor Green
try {
    $testUrl = "$appUrl/api/debug"
    $response = Invoke-RestMethod -Uri $testUrl -Method Get -TimeoutSec 30
    
    if ($response.authenticated) {
        Write-Host "✅ Configuration test passed!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Configuration test inconclusive. Check manually at: $testUrl" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Configuration test failed. The app may need a few minutes to update." -ForegroundColor Yellow
    Write-Host "     Test manually at: $appUrl/api/debug" -ForegroundColor Blue
}

# Summary
Write-Host ""
Write-Host "🎉 Configuration Complete!" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Configuration Summary:" -ForegroundColor White
Write-Host "  • App Registration ID: $($app.AppId)" -ForegroundColor Blue
Write-Host "  • App URL: $appUrl" -ForegroundColor Blue
Write-Host "  • Tenant ID: $TenantId" -ForegroundColor Blue
Write-Host "  • Resource Group: $ResourceGroupName" -ForegroundColor Blue
Write-Host ""
Write-Host "🔗 Important Links:" -ForegroundColor White
Write-Host "  • Your App: $appUrl" -ForegroundColor Green
Write-Host "  • Setup Guide: https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/blob/main/SETUP_GUIDE.md" -ForegroundColor Blue
Write-Host "  • Troubleshooting: https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/blob/main/TROUBLESHOOTING.md" -ForegroundColor Blue
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor White
Write-Host "  1. Visit your app URL to test authentication" -ForegroundColor Green
Write-Host "  2. Try searching for users in your organization" -ForegroundColor Green
Write-Host "  3. Test group membership visualization" -ForegroundColor Green
Write-Host "  4. Review the documentation for customization options" -ForegroundColor Green
Write-Host ""

# Save configuration details for MSAL setup
$configFile = "group-visualizer-config.txt"
$appIdValue = $app.AppId
$currentDate = Get-Date

# Build configuration content without here-string to avoid parsing issues
$configContent = "Group Tree Membership Visualizer - MSAL Configuration Details`n"
$configContent += "Generated: $currentDate`n`n"
$configContent += "App Registration (Single-tenant SPA):`n"
$configContent += "- Display Name: $appDisplayName`n"
$configContent += "- Application ID: $appIdValue`n"
$configContent += "- Tenant ID: $TenantId`n"
$configContent += "- Platform: Single Page Application (SPA)`n"
$configContent += "- Authentication: MSAL.js with PKCE`n`n"
$configContent += "Static Web App:`n"
$configContent += "- Name: $StaticWebAppName`n"
$configContent += "- Resource Group: $ResourceGroupName`n"
$configContent += "- URL: $appUrl`n`n"
$configContent += "Environment Variables (MSAL):`n"
$configContent += "- NEXT_PUBLIC_AZURE_CLIENT_ID: $appIdValue`n"
$configContent += "- AZURE_TENANT_ID: $TenantId`n"
$configContent += "- Note: No client secret needed for MSAL SPA with PKCE`n`n"
$configContent += "Important Links:`n"
$configContent += "- Application URL: $appUrl`n"
$configContent += "- Setup Guide: https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/blob/main/SETUP_GUIDE.md`n"
$configContent += "- Troubleshooting: https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/blob/main/TROUBLESHOOTING.md`n`n"
$configContent += "Manual Configuration Commands (if needed):`n"
$configContent += "az staticwebapp appsettings set --name `"$StaticWebAppName`" --resource-group `"$ResourceGroupName`" --setting-names NEXT_PUBLIC_AZURE_CLIENT_ID=`"$appIdValue`" AZURE_TENANT_ID=`"$TenantId`"`n"

$configContent | Out-File -FilePath $configFile -Encoding UTF8
Write-Host "💾 MSAL configuration details saved to: $configFile" -ForegroundColor Blue

Write-Host ""
Write-Host "🚀 Your Group Tree Membership Visualizer is ready to use!" -ForegroundColor Cyan
Write-Host "   Visit: $appUrl" -ForegroundColor Green
Write-Host ""

