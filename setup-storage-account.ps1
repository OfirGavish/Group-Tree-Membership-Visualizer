#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Sets up Azure Storage Account for hosting pre-built Group Tree Membership Visualizer packages
    
.DESCRIPTION
    This script creates an Azure Storage Account with public anonymous access for hosting
    pre-built deployment packages. This enables fully automated deployment without GitHub dependencies.
    
.PARAMETER StorageAccountName
    Name of the storage account to create (must be globally unique)
    
.PARAMETER ResourceGroupName
    Resource group name for the storage account
    
.PARAMETER Location
    Azure region for the storage account
    
.PARAMETER SubscriptionId
    Azure subscription ID (optional, uses current context if not provided)
    
.EXAMPLE
    .\setup-storage-account.ps1 -StorageAccountName "grouptreevisualizer" -ResourceGroupName "rg-releases"
    
.EXAMPLE
    .\setup-storage-account.ps1 -StorageAccountName "mycompanygtv" -ResourceGroupName "rg-gtv" -Location "West US 2"
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$StorageAccountName,
    
    [Parameter(Mandatory = $true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory = $false)]
    [string]$Location = "East US 2",
    
    [Parameter(Mandatory = $false)]
    [string]$SubscriptionId = ""
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
            $versionLine = ($azVersion | Select-String "azure-cli").Line
            Write-StyledOutput "   Version: $versionLine" $ColorInfo
        }
    }
    catch {
        throw "❌ Azure CLI is required but not found. Please install Azure CLI."
    }
    
    # Check if logged in
    try {
        $account = az account show 2>$null | ConvertFrom-Json
        if ($account) {
            Write-StyledOutput "✅ Logged in to Azure as: $($account.user.name)" $ColorSuccess
            Write-StyledOutput "   Current subscription: $($account.name)" $ColorInfo
        }
    }
    catch {
        throw "❌ Not logged in to Azure. Please run 'az login' first."
    }
}

function Set-AzureContext {
    param([string]$SubscriptionId)
    
    if (-not [string]::IsNullOrEmpty($SubscriptionId)) {
        Write-StyledOutput "🔄 Setting Azure subscription context to: $SubscriptionId" $ColorInfo
        az account set --subscription $SubscriptionId
        if ($LASTEXITCODE -ne 0) {
            throw "❌ Failed to set subscription context"
        }
        Write-StyledOutput "✅ Subscription context set" $ColorSuccess
    }
}

function New-StorageAccount {
    param(
        [string]$Name,
        [string]$ResourceGroup,
        [string]$Location
    )
    
    Write-StyledOutput "🏗️  Creating storage account setup..." $ColorInfo
    
    # Create resource group if it doesn't exist
    Write-StyledOutput "📁 Checking resource group: $ResourceGroup" $ColorInfo
    $rgExists = az group exists --name $ResourceGroup
    
    if ($rgExists -eq "false") {
        Write-StyledOutput "📁 Creating resource group: $ResourceGroup" $ColorInfo
        az group create --name $ResourceGroup --location $Location --output table
        if ($LASTEXITCODE -ne 0) {
            throw "❌ Failed to create resource group"
        }
        Write-StyledOutput "✅ Resource group created" $ColorSuccess
    } else {
        Write-StyledOutput "✅ Resource group already exists" $ColorSuccess
    }
    
    # Check if storage account already exists
    Write-StyledOutput "🗄️  Checking storage account: $Name" $ColorInfo
    $storageExists = az storage account check-name --name $Name --query "nameAvailable" -o tsv
    
    if ($storageExists -eq "false") {
        Write-StyledOutput "✅ Storage account already exists, updating configuration..." $ColorSuccess
    } else {
        # Create storage account
        Write-StyledOutput "🗄️  Creating storage account: $Name" $ColorInfo
        az storage account create `
            --name $Name `
            --resource-group $ResourceGroup `
            --location $Location `
            --sku Standard_LRS `
            --kind StorageV2 `
            --access-tier Hot `
            --allow-blob-public-access true `
            --output table
        
        if ($LASTEXITCODE -ne 0) {
            throw "❌ Failed to create storage account"
        }
        Write-StyledOutput "✅ Storage account created" $ColorSuccess
    }
    
    # Create releases container
    Write-StyledOutput "📦 Creating releases container..." $ColorInfo
    az storage container create `
        --name "releases" `
        --account-name $Name `
        --public-access blob `
        --output table
    
    if ($LASTEXITCODE -ne 0) {
        Write-StyledOutput "⚠️  Container might already exist, continuing..." $ColorWarning
    } else {
        Write-StyledOutput "✅ Releases container created with public access" $ColorSuccess
    }
    
    # Set CORS policy for web access
    Write-StyledOutput "🌐 Configuring CORS policy..." $ColorInfo
    az storage cors add `
        --account-name $Name `
        --services b `
        --methods GET HEAD `
        --origins "*" `
        --allowed-headers "*" `
        --max-age 86400
    
    Write-StyledOutput "✅ CORS policy configured" $ColorSuccess
}

function Test-StorageSetup {
    param([string]$StorageAccountName)
    
    Write-StyledOutput "🧪 Testing storage account setup..." $ColorInfo
    
    # Test blob access
    $testUrl = "https://$StorageAccountName.blob.core.windows.net/releases"
    
    try {
        $response = Invoke-WebRequest -Uri $testUrl -Method Head -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-StyledOutput "✅ Storage account is publicly accessible" $ColorSuccess
        }
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-StyledOutput "✅ Storage account is accessible (empty container)" $ColorSuccess
        } else {
            Write-StyledOutput "⚠️  Could not verify public access: $($_.Exception.Message)" $ColorWarning
        }
    }
    
    # Get storage account details
    $storageInfo = az storage account show --name $StorageAccountName --query "{primaryEndpoint:primaryEndpoints.blob, allowPublicAccess:allowBlobPublicAccess}" -o json | ConvertFrom-Json
    
    Write-StyledOutput "📋 Storage Account Details:" $ColorInfo
    Write-StyledOutput "   Blob Endpoint: $($storageInfo.primaryEndpoint)" $ColorInfo
    Write-StyledOutput "   Public Access: $($storageInfo.allowPublicAccess)" $ColorInfo
    Write-StyledOutput "   Releases URL: $($storageInfo.primaryEndpoint)releases/" $ColorInfo
}

function Show-NextSteps {
    param([string]$StorageAccountName, [string]$ResourceGroupName)
    
    $storageUrl = "https://$StorageAccountName.blob.core.windows.net/releases"
    
    Write-StyledOutput "`n🎉 Storage Account Setup Complete!" $ColorSuccess
    Write-StyledOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" $ColorSuccess
    
    Write-StyledOutput "`n📋 Configuration Details:" $ColorInfo
    Write-StyledOutput "   Storage Account: $StorageAccountName" $ColorSuccess
    Write-StyledOutput "   Resource Group: $ResourceGroupName" $ColorSuccess
    Write-StyledOutput "   Releases URL: $storageUrl" $ColorSuccess
    Write-StyledOutput "   Public Access: Enabled" $ColorSuccess
    
    Write-StyledOutput "`n🔧 Next Steps:" $ColorInfo
    Write-StyledOutput "   1. Update GitHub Actions secrets with Azure credentials" $ColorWarning
    Write-StyledOutput "   2. Update ARM template with your storage account name" $ColorWarning
    Write-StyledOutput "   3. Run build workflow to upload first package" $ColorWarning
    Write-StyledOutput "   4. Test automated deployment" $ColorWarning
    
    Write-StyledOutput "`n📝 GitHub Actions Configuration:" $ColorInfo
    Write-StyledOutput "   Update .github/workflows/build-and-upload.yml:" $ColorWarning
    Write-StyledOutput "   env:" $ColorInfo
    Write-StyledOutput "     STORAGE_ACCOUNT: $StorageAccountName" $ColorInfo
    
    Write-StyledOutput "`n🔑 Azure Credentials for GitHub:" $ColorInfo
    Write-StyledOutput "   Create service principal:" $ColorWarning
    Write-StyledOutput "   az ad sp create-for-rbac --name 'github-actions-$StorageAccountName' --role Contributor --scopes /subscriptions/{subscription-id}/resourceGroups/$ResourceGroupName --sdk-auth" $ColorInfo
    
    Write-StyledOutput "`n🚀 ARM Template Updates:" $ColorInfo
    Write-StyledOutput "   Update azuredeploy-automated-simple.json:" $ColorWarning
    Write-StyledOutput "   sourceStorageAccount default value: $StorageAccountName" $ColorInfo
    
    Write-StyledOutput "`n🧪 Test Deployment:" $ColorInfo
    Write-StyledOutput "   After uploading packages, test with:" $ColorWarning
    Write-StyledOutput "   Deploy to Azure button pointing to your ARM template" $ColorInfo
    
    Write-StyledOutput "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" $ColorSuccess
}

# Main execution
try {
    Write-StyledOutput "🗄️  Azure Storage Account Setup for Group Tree Visualizer" $ColorSuccess
    Write-StyledOutput "═══════════════════════════════════════════════════════════" $ColorSuccess
    
    Test-Prerequisites
    Set-AzureContext -SubscriptionId $SubscriptionId
    New-StorageAccount -Name $StorageAccountName -ResourceGroup $ResourceGroupName -Location $Location
    Test-StorageSetup -StorageAccountName $StorageAccountName
    Show-NextSteps -StorageAccountName $StorageAccountName -ResourceGroupName $ResourceGroupName
}
catch {
    Write-StyledOutput "`n❌ Setup failed: $($_.Exception.Message)" $ColorError
    Write-StyledOutput "💡 Check the error message above and try again." $ColorWarning
    exit 1
}
