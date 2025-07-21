# 🔧 Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the Group Tree Membership Visualizer.

## 📋 Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Authentication Issues](#authentication-issues)
- [API Permission Errors](#api-permission-errors)
- [Visualization Problems](#visualization-problems)
- [Performance Issues](#performance-issues)
- [Deployment Problems](#deployment-problems)
- [Configuration Errors](#configuration-errors)
- [Browser Compatibility](#browser-compatibility)
- [Getting Help](#getting-help)

## 🎯 Quick Diagnostics

### Health Check Steps

1. **Test Authentication**
   ```
   https://your-app-name.azurestaticapps.net/api/debug
   ```
   Expected response:
   ```json
   {
     "authenticated": true,
     "user": { "displayName": "Your Name" },
     "permissions": ["User.Read.All", "Group.Read.All"],
     "status": "success"
   }
   ```

2. **Verify Environment Variables**
   Check Azure Portal → Static Web App → Configuration:
   - ✅ AZURE_CLIENT_ID exists
   - ✅ AZURE_CLIENT_SECRET exists  
   - ✅ AZURE_TENANT_ID exists

3. **Test API Endpoints**
   ```bash
   # Test user search
   curl -X POST https://your-app-name.azurestaticapps.net/api/search/users \
     -H "Content-Type: application/json" \
     -d '{"query":"john"}'
   ```

## 🔐 Authentication Issues

### Issue: "Sign in required" loop

**Symptoms:**
- User gets redirected to sign-in repeatedly
- Authentication never completes
- Console shows MSAL errors

**Solutions:**

1. **Check Redirect URIs**
   ```typescript
   // Verify in Azure Portal → App Registration → Authentication
   const validRedirectUris = [
     "https://your-app-name.azurestaticapps.net",
     "https://your-app-name.azurestaticapps.net/",
     "http://localhost:3000" // for development
   ];
   ```

2. **Clear Browser Cache**
   ```javascript
   // Clear MSAL cache
   localStorage.removeItem('msal.cache');
   sessionStorage.clear();
   ```

3. **Check App Registration Settings**
   - Supported account types: Single tenant
   - Allow public client flows: No
   - Default client type: Public client

### Issue: "AADSTS50020: User account from identity provider does not exist"

**Symptoms:**
- User exists in directory but can't sign in
- External users can't access

**Solutions:**

1. **Verify Tenant Configuration**
   ```powershell
   # Check user's tenant
   Get-AzureADUser -ObjectId "user@domain.com" | Select-Object UserPrincipalName, UserType
   ```

2. **Guest User Access**
   ```typescript
   // Update app registration to allow guest users
   const msalConfig = {
     auth: {
       authority: "https://login.microsoftonline.com/common", // Allow guest users
       // OR for single tenant:
       authority: `https://login.microsoftonline.com/${tenantId}`
     }
   };
   ```

### Issue: Token expiration errors

**Symptoms:**
- Initial login works, then fails after 1 hour
- "Token expired" errors in console

**Solutions:**

1. **Implement Token Refresh**
   ```typescript
   const getValidToken = async () => {
     try {
       return await msalInstance.acquireTokenSilent(tokenRequest);
     } catch (error) {
       if (error instanceof InteractionRequiredAuthError) {
         return await msalInstance.acquireTokenPopup(tokenRequest);
       }
       throw error;
     }
   };
   ```

2. **Check Token Lifetime Policies**
   ```powershell
   # Check token lifetime settings
   Get-AzureADPolicy -Type TokenLifetimePolicy
   ```

## 🔑 API Permission Errors

### Issue: "Insufficient privileges to complete the operation"

**Symptoms:**
- Authentication succeeds but API calls fail
- 403 Forbidden errors
- Empty search results

**Solutions:**

1. **Verify Admin Consent**
   ```powershell
   # Check granted permissions
   $app = Get-AzureADServicePrincipal -Filter "displayName eq 'Group Tree Membership Visualizer'"
   Get-AzureADServicePrincipalOAuth2PermissionGrant -ObjectId $app.ObjectId
   ```

2. **Grant Missing Permissions**
   ```powershell
   # Grant admin consent via PowerShell
   $appId = "your-app-id"
   $permissions = @("User.Read.All", "Group.Read.All", "Directory.Read.All", "GroupMember.Read.All")
   
   foreach ($permission in $permissions) {
     New-AzureADServiceAppRoleAssignment -ObjectId $app.ObjectId -PrincipalId $app.ObjectId -ResourceId $graphServicePrincipal.ObjectId -Id $roleId
   }
   ```

3. **Check Permission Scope**
   ```typescript
   // Verify required scopes in API calls
   const requiredScopes = [
     "https://graph.microsoft.com/User.Read.All",
     "https://graph.microsoft.com/Group.Read.All",
     "https://graph.microsoft.com/Directory.Read.All"
   ];
   ```

### Issue: "The user or administrator has not consented to use the application"

**Symptoms:**
- AADSTS65001 error code
- Admin consent prompt appears repeatedly

**Solutions:**

1. **Manual Admin Consent**
   ```
   https://login.microsoftonline.com/{tenant-id}/adminconsent?client_id={client-id}
   ```

2. **PowerShell Admin Consent**
   ```powershell
   # Connect as Global Admin
   Connect-AzureAD
   
   # Grant admin consent
   $app = Get-AzureADApplication -Filter "displayName eq 'Group Tree Membership Visualizer'"
   New-AzureADServicePrincipal -AppId $app.AppId
   ```

## 🌳 Visualization Problems

### Issue: Tree doesn't render or appears blank

**Symptoms:**
- Empty white space where tree should be
- No D3.js elements in DOM
- Console shows D3 errors

**Solutions:**

1. **Check Data Format**
   ```typescript
   // Verify tree data structure
   const validateTreeData = (data: TreeNode[]) => {
     return data.every(node => 
       node.id && 
       node.name && 
       Array.isArray(node.children)
     );
   };
   ```

2. **Debug D3 Rendering**
   ```typescript
   // Add debugging to D3 component
   useEffect(() => {
     console.log('Tree data:', treeData);
     console.log('SVG element:', svgRef.current);
     
     if (!treeData.length) {
       console.warn('No tree data provided');
       return;
     }
     
     renderTree();
   }, [treeData]);
   ```

3. **Check Container Dimensions**
   ```typescript
   // Ensure container has proper dimensions
   const containerRef = useRef<HTMLDivElement>(null);
   
   useEffect(() => {
     if (containerRef.current) {
       const { width, height } = containerRef.current.getBoundingClientRect();
       console.log('Container dimensions:', { width, height });
       
       if (width === 0 || height === 0) {
         console.error('Container has no dimensions');
       }
     }
   }, []);
   ```

### Issue: Tree layout is corrupted or overlapping

**Symptoms:**
- Nodes overlap each other
- Links cross inappropriately
- Tree appears compressed

**Solutions:**

1. **Adjust D3 Layout Parameters**
   ```typescript
   const treeLayout = d3.tree<TreeNode>()
     .size([width, height])
     .nodeSize([120, 80]) // Increase node spacing
     .separation((a, b) => a.parent === b.parent ? 2 : 3);
   ```

2. **Implement Dynamic Sizing**
   ```typescript
   // Calculate dimensions based on data
   const calculateDimensions = (nodeCount: number) => {
     const minWidth = 800;
     const minHeight = 600;
     const nodeWidth = 120;
     const nodeHeight = 80;
     
     return {
       width: Math.max(minWidth, Math.sqrt(nodeCount) * nodeWidth),
       height: Math.max(minHeight, Math.sqrt(nodeCount) * nodeHeight)
     };
   };
   ```

### Issue: Empty groups not highlighted correctly

**Symptoms:**
- All groups appear the same color
- No visual indication of empty groups
- Red highlighting doesn't work

**Solutions:**

1. **Verify Empty Group Detection**
   ```typescript
   // Debug empty group detection
   const checkEmptyGroups = async (groupId: string) => {
     try {
       const members = await ApiGraphService.getGroupMembers(groupId);
       console.log(`Group ${groupId} has ${members.length} members`);
       return members.length === 0;
     } catch (error) {
       console.error(`Failed to check group ${groupId}:`, error);
       return false;
     }
   };
   ```

2. **Fix Styling Logic**
   ```typescript
   // Ensure proper styling application
   const getNodeStyle = (node: TreeNode) => {
     const baseStyle = "fill-white/20 stroke-white/30";
     const emptyStyle = "fill-red-500/30 stroke-red-500/50";
     
     return node.type === 'group' && node.isEmpty 
       ? emptyStyle 
       : baseStyle;
   };
   ```

## ⚡ Performance Issues

### Issue: Slow loading or timeouts

**Symptoms:**
- Long wait times for search results
- API timeouts (>30 seconds)
- Browser becomes unresponsive

**Solutions:**

1. **Implement Caching**
   ```typescript
   // Add request caching
   const cache = new Map<string, { data: any; timestamp: number }>();
   const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
   
   const getCachedData = (key: string) => {
     const cached = cache.get(key);
     if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
       return cached.data;
     }
     cache.delete(key);
     return null;
   };
   ```

2. **Optimize Graph API Calls**
   ```typescript
   // Use selective fields and pagination
   const searchUsers = async (query: string) => {
     return await graphClient
       .users
       .select(['id', 'displayName', 'mail', 'userPrincipalName'])
       .filter(`startswith(displayName,'${query}') or startswith(mail,'${query}')`)
       .top(20)
       .get();
   };
   ```

3. **Implement Request Batching**
   ```typescript
   // Batch multiple API requests
   const batchGroupRequests = async (groupIds: string[]) => {
     const batch = graphClient.createBatch();
     
     groupIds.forEach(id => {
       batch.add({
         id,
         request: graphClient.groups.get(id).select(['id', 'displayName', 'members'])
       });
     });
     
     return await batch.execute();
   };
   ```

### Issue: Memory leaks or high memory usage

**Symptoms:**
- Browser memory usage keeps increasing
- Page becomes slow after extended use
- React DevTools shows growing component tree

**Solutions:**

1. **Cleanup Event Listeners**
   ```typescript
   useEffect(() => {
     const handleResize = () => resizeTree();
     window.addEventListener('resize', handleResize);
     
     return () => {
       window.removeEventListener('resize', handleResize);
     };
   }, []);
   ```

2. **Optimize D3 Updates**
   ```typescript
   // Properly remove old D3 elements
   const updateVisualization = (newData: TreeNode[]) => {
     // Remove old elements
     svg.selectAll('.node').remove();
     svg.selectAll('.link').remove();
     
     // Add new elements
     renderTree(newData);
   };
   ```

## 🚀 Deployment Problems

### Issue: Build fails in Azure Static Web Apps

**Symptoms:**
- GitHub Actions workflow fails
- Build errors in Azure portal
- App doesn't update after push

**Solutions:**

1. **Check Build Configuration**
   ```yaml
   # Verify .github/workflows/azure-static-web-apps-*.yml
   - name: Build And Deploy
     uses: Azure/static-web-apps-deploy@v1
     with:
       app_location: "/" # Should be root
       api_location: "api" # Should be api folder
       output_location: "out" # Should match next.config.js
   ```

2. **Fix Next.js Export Issues**
   ```javascript
   // next.config.js
   const nextConfig = {
     output: 'export',
     trailingSlash: true,
     images: {
       unoptimized: true
     }
   };
   ```

3. **Check Package Dependencies**
   ```json
   // Ensure all dependencies are in package.json
   {
     "dependencies": {
       "next": "15.0.0",
       "@azure/msal-browser": "^3.0.0",
       "@azure/msal-node": "^2.0.0"
     }
   }
   ```

### Issue: Environment variables not working

**Symptoms:**
- API calls fail with authentication errors
- Process.env variables are undefined
- App works locally but fails in Azure

**Solutions:**

1. **Verify Variable Names**
   ```typescript
   // Check exact variable names
   const requiredVars = [
     'AZURE_CLIENT_ID',
     'AZURE_CLIENT_SECRET', 
     'AZURE_TENANT_ID'
   ];
   
   requiredVars.forEach(varName => {
     if (!process.env[varName]) {
       console.error(`Missing environment variable: ${varName}`);
     }
   });
   ```

2. **Restart Static Web App**
   ```bash
   # Environment changes require restart
   az staticwebapp restart --name "your-app-name"
   ```

## ⚙️ Configuration Errors

### Issue: "Client secret has expired"

**Symptoms:**
- Authentication was working, now fails
- AADSTS7000222 error code
- API returns 401 Unauthorized

**Solutions:**

1. **Generate New Client Secret**
   ```powershell
   # Create new secret
   $app = Get-AzureADApplication -Filter "displayName eq 'Group Tree Membership Visualizer'"
   $secret = New-AzureADApplicationPasswordCredential -ObjectId $app.ObjectId -CustomKeyIdentifier "NewSecret" -EndDate (Get-Date).AddMonths(24)
   
   Write-Host "New secret: $($secret.Value)"
   ```

2. **Update Environment Variables**
   - Go to Azure Portal → Static Web App → Configuration
   - Update AZURE_CLIENT_SECRET with new value
   - Save and restart app

### Issue: "Invalid client" errors

**Symptoms:**
- AADSTS700016 error code
- App registration not found errors

**Solutions:**

1. **Verify Client ID**
   ```powershell
   # Check app registration exists
   Get-AzureADApplication -Filter "appId eq 'your-client-id'"
   ```

2. **Check Tenant ID**
   ```powershell
   # Verify tenant ID
   (Get-AzureADTenantDetail).ObjectId
   ```

## 🌐 Browser Compatibility

### Supported Browsers

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | ✅ Fully supported |
| Edge | 90+ | ✅ Fully supported |
| Firefox | 88+ | ✅ Fully supported |
| Safari | 14+ | ⚠️ Limited MSAL support |

### Common Browser Issues

#### Safari MSAL Problems
```typescript
// Safari-specific MSAL configuration
const msalConfig = {
  cache: {
    cacheLocation: "sessionStorage", // Use sessionStorage for Safari
    storeAuthStateInCookie: true
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (!containsPii) {
          console.log(message);
        }
      }
    }
  }
};
```

#### IE/Legacy Browser Support
```typescript
// Check for modern browser features
const checkBrowserSupport = () => {
  const required = [
    'fetch',
    'Promise',
    'Map',
    'Set'
  ];
  
  const missing = required.filter(feature => !(feature in window));
  
  if (missing.length > 0) {
    alert(`Your browser is not supported. Missing features: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
};
```

## 📞 Getting Help

### Debug Information Collection

Before reaching out for help, collect this information:

1. **Environment Details**
   ```bash
   # Browser version
   navigator.userAgent
   
   # App version
   curl https://your-app-name.azurestaticapps.net/api/debug
   ```

2. **Error Details**
   - Full error message
   - Browser console logs
   - Network tab responses
   - Steps to reproduce

3. **Configuration Check**
   - App registration screenshot
   - Environment variables (without secrets)
   - Azure Static Web App configuration

### Useful Commands

```powershell
# Azure CLI diagnostics
az staticwebapp show --name "your-app-name" --query "{name:name,defaultHostname:defaultHostname,resourceGroup:resourceGroup}"

# Check app registration
az ad app show --id "your-client-id" --query "{appId:appId,displayName:displayName,signInAudience:signInAudience}"

# List API permissions
az ad app permission list --id "your-client-id"
```

### Log Analysis

```typescript
// Enable verbose logging
const enableDebugLogging = () => {
  // MSAL logging
  const loggerOptions = {
    loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
      if (!containsPii) {
        console.log(`[MSAL ${LogLevel[level]}] ${message}`);
      }
    },
    piiLoggingEnabled: false,
    logLevel: LogLevel.Verbose
  };
  
  // API logging
  window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason);
  });
};
```

### Contact Support

If you're still experiencing issues:

1. **GitHub Issues**: [Create an issue](https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/issues)
2. **Include**:
   - Environment details
   - Error messages
   - Steps to reproduce
   - Screenshots if helpful

### Community Resources

- **Microsoft Graph Documentation**: https://docs.microsoft.com/graph
- **MSAL Documentation**: https://docs.microsoft.com/azure/active-directory/develop/msal-overview
- **Azure Static Web Apps**: https://docs.microsoft.com/azure/static-web-apps
- **Next.js Documentation**: https://nextjs.org/docs

---

Most issues can be resolved by following this guide. If you encounter a new issue not covered here, please help improve this guide by documenting your solution! 🚀
