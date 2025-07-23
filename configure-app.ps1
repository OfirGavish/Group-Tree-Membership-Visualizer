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
    [switch]$SkipAdminConsent
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
    if (!$azContext) {
        Write-Host "  📝 No existing Azure context found. Initiating login..." -ForegroundColor Blue
        Connect-AzAccount
        $azContext = Get-AzContext
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
    Write-Host "📝 Creating new app registration..." -ForegroundColor Green
    
    # Create app registration with redirect URIs
    $appParams = @{
        DisplayName = $appDisplayName
        Web = @{
            RedirectUris = @($appUrl, "$appUrl/", "http://localhost:3000")
        }
    }
    
    $app = New-MgApplication @appParams
    Write-Host "✅ Created app registration: $($app.AppId)" -ForegroundColor Green
}

# Generate client secret
Write-Host "🔑 Generating client secret..." -ForegroundColor Green
$secretDisplayName = "GroupVisualizerSecret-$(Get-Date -Format 'yyyy-MM-dd')"
$secretEndDate = (Get-Date).AddMonths(24)

try {
    $existingSecrets = Get-MgApplicationPasswordCredential -ApplicationId $app.Id
    if ($existingSecrets) {
        Write-Host "⚠️  Existing secrets found. Creating additional secret..." -ForegroundColor Yellow
    }
    
    $passwordCredential = @{
        displayName = $secretDisplayName
        endDateTime = $secretEndDate
    }
    
    $clientSecret = Add-MgApplicationPassword -ApplicationId $app.Id -PasswordCredential $passwordCredential
    Write-Host "✅ Client secret created (expires: $($secretEndDate.ToString('yyyy-MM-dd')))" -ForegroundColor Green
} catch {
    Write-Error "❌ Failed to create client secret: $($_.Exception.Message)"
    exit 1
}

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

# Required Microsoft Graph permissions for delegated access
$requiredDelegatedPermissions = @(
    @{ Value = "User.Read"; Type = "Scope" },
    @{ Value = "User.Read.All"; Type = "Scope" },
    @{ Value = "Group.Read.All"; Type = "Scope" },
    @{ Value = "Directory.Read.All"; Type = "Scope" },
    @{ Value = "Device.Read.All"; Type = "Scope" }
)

# Required Microsoft Graph permissions for application access (fallback)
$requiredApplicationPermissions = @(
    @{ Value = "User.Read.All"; Type = "Role" },
    @{ Value = "Group.Read.All"; Type = "Role" },
    @{ Value = "Directory.Read.All"; Type = "Role" },
    @{ Value = "GroupMember.Read.All"; Type = "Role" },
    @{ Value = "Device.Read.All"; Type = "Role" }
)

Write-Host "🔐 Configuring Microsoft Graph permissions (delegated + application)..." -ForegroundColor Green

# Get Microsoft Graph service principal
$graphServicePrincipal = Get-MgServicePrincipal -Filter "appId eq '00000003-0000-0000-c000-000000000000'"

# Update app registration to support web platform for delegated permissions
Write-Host "🌐 Updating app registration for web platform..." -ForegroundColor Green
try {
    # Add web platform if not exists
    $redirectUris = @(
        "$appUrl/.auth/login/aad/callback",
        "https://localhost:3000/.auth/login/aad/callback"
    )
    
    # Update the application to support web platform
    $webParams = @{
        ApplicationId = $app.Id
        Web = @{
            RedirectUris = $redirectUris
        }
    }
    Update-MgApplication @webParams
    Write-Host "✅ Web platform configured with redirect URIs" -ForegroundColor Green
} catch {
    Write-Warning "⚠️  Failed to update web platform configuration: $($_.Exception.Message)"
}

# Add Microsoft Graph API permissions
Write-Host "🔐 Configuring Microsoft Graph API permissions..." -ForegroundColor Green
try {
    # Build required resource access for Microsoft Graph
    $requiredResourceAccess = @()
    
    # Add delegated permissions (scopes)
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
    
    # Add application permissions (roles)
    $applicationPermissions = @()
    foreach ($permission in $requiredApplicationPermissions) {
        $appRole = $graphServicePrincipal.AppRoles | Where-Object {$_.Value -eq $permission.Value}
        if ($appRole) {
            $applicationPermissions += @{
                Id = $appRole.Id
                Type = "Role"
            }
            Write-Host "  ✅ Will request application permission: $($permission.Value)" -ForegroundColor Green
        }
    }
    
    # Combine all permissions
    $allPermissions = $delegatedPermissions + $applicationPermissions
    
    if ($allPermissions.Count -gt 0) {
        $requiredResourceAccess += @{
            ResourceAppId = "00000003-0000-0000-c000-000000000000"  # Microsoft Graph
            ResourceAccess = $allPermissions
        }
        
        # Update the application with required permissions
        $updateParams = @{
            ApplicationId = $app.Id
            RequiredResourceAccess = $requiredResourceAccess
        }
        Update-MgApplication @updateParams
        Write-Host "✅ Microsoft Graph API permissions configured" -ForegroundColor Green
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

# Configure Static Web App environment variables
Write-Host "⚙️  Configuring Static Web App environment variables..." -ForegroundColor Green

$appSettings = @{
    "ENTRA_CLIENT_ID" = $app.AppId
    "ENTRA_CLIENT_SECRET" = $clientSecret.SecretText
    "AZURE_CLIENT_ID" = $app.AppId  # Keeping for backward compatibility
    "AZURE_CLIENT_SECRET" = $clientSecret.SecretText  # Keeping for backward compatibility
    "AZURE_TENANT_ID" = $TenantId
}

try {
    if ($azCliAvailable) {
        # Use Azure CLI for setting Static Web App settings as it's more reliable
        Write-Host "  🔧 Setting environment variables using Azure CLI..." -ForegroundColor Blue
        
        foreach ($setting in $appSettings.GetEnumerator()) {
            $settingString = "$($setting.Key)=$($setting.Value)"
            $result = az staticwebapp appsettings set --name $StaticWebAppName --resource-group $ResourceGroupName --setting-names $settingString 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "    ✅ Set $($setting.Key)" -ForegroundColor Green
            } else {
                Write-Warning "    ⚠️  Failed to set $($setting.Key)"
            }
        }
        Write-Host "✅ Environment variables configured" -ForegroundColor Green
    } else {
        throw "Azure CLI not available"
    }
} catch {
    Write-Warning "⚠️  Failed to set environment variables automatically. Please set them manually using Azure CLI:"
    foreach ($setting in $appSettings.GetEnumerator()) {
        if ($setting.Key -like "*SECRET*") {
            Write-Host "  az staticwebapp appsettings set --name `"$StaticWebAppName`" --resource-group `"$ResourceGroupName`" --setting-names `"$($setting.Key)=[HIDDEN]`"" -ForegroundColor Yellow
        } else {
            Write-Host "  az staticwebapp appsettings set --name `"$StaticWebAppName`" --resource-group `"$ResourceGroupName`" --setting-names `"$($setting.Key)=$($setting.Value)`"" -ForegroundColor Yellow
        }
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

# Save configuration details
$configFile = "group-visualizer-config.txt"
$configContent = @"
Group Tree Membership Visualizer - Configuration Details
Generated: $(Get-Date)

App Registration:
- Display Name: $appDisplayName
- Application ID: $($app.AppId)
- Tenant ID: $TenantId

Static Web App:
- Name: $StaticWebAppName
- Resource Group: $ResourceGroupName
- URL: $appUrl

Environment Variables:
- AZURE_CLIENT_ID: $($app.AppId)
- AZURE_CLIENT_SECRET: [HIDDEN - Check Azure Portal]
- AZURE_TENANT_ID: $TenantId

Important Links:
- Application URL: $appUrl
- Setup Guide: https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/blob/main/SETUP_GUIDE.md
- Troubleshooting: https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/blob/main/TROUBLESHOOTING.md

Manual Configuration Commands:
az staticwebapp appsettings set --name "$StaticWebAppName" --resource-group "$ResourceGroupName" --setting-names AZURE_CLIENT_ID="$($app.AppId)" AZURE_CLIENT_SECRET="your-secret" AZURE_TENANT_ID="$TenantId"
"@

$configContent | Out-File -FilePath $configFile -Encoding UTF8
Write-Host "💾 Configuration details saved to: $configFile" -ForegroundColor Blue

Write-Host ""
Write-Host "🚀 Your Group Tree Membership Visualizer is ready to use!" -ForegroundColor Cyan
Write-Host "   Visit: $appUrl" -ForegroundColor Green
Write-Host ""
