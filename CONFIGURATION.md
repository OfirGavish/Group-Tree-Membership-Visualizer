# ⚙️ Configuration Reference

This document provides comprehensive configuration details for the Group Tree Membership Visualizer.

## 🌍 Environment Variables

The application requires several environment variables to be configured in Azure Static Web Apps.

### Required Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `AZURE_CLIENT_ID` | App Registration Client ID | `12345678-1234-1234-1234-123456789012` | ✅ Yes |
| `AZURE_CLIENT_SECRET` | App Registration Client Secret | `abcd1234-secret-value` | ✅ Yes |
| `AZURE_TENANT_ID` | Azure AD Tenant ID | `87654321-4321-4321-4321-210987654321` | ✅ Yes |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `APP_NAME` | Application display name | "Group Tree Membership Visualizer" | "My Org Visualizer" |
| `MAX_SEARCH_RESULTS` | Maximum search results | 50 | 100 |
| `CACHE_TTL_SECONDS` | Cache TTL for Graph data | 300 | 600 |
| `DEBUG_MODE` | Enable debug logging | false | true |

### Setting Environment Variables

#### Via Azure Portal
1. Navigate to your Static Web App
2. Go to **Configuration** in the left menu
3. Click **+ Add** for each variable
4. Enter **Name** and **Value**
5. Click **OK** and **Save**

#### Via Azure CLI
```bash
# Set required variables
az staticwebapp appsettings set \
  --name "your-app-name" \
  --setting-names \
    AZURE_CLIENT_ID="your-client-id" \
    AZURE_CLIENT_SECRET="your-client-secret" \
    AZURE_TENANT_ID="your-tenant-id"
```

## 🔐 Microsoft Graph Permissions

The application requires specific Microsoft Graph API permissions to function properly.

### Application Permissions (Required)

These permissions are granted to the application itself, not individual users:

| Permission | Scope | Purpose | Admin Consent |
|------------|-------|---------|---------------|
| `User.Read.All` | All users | Read user profiles and search directory | ✅ Required |
| `Group.Read.All` | All groups | Read group information and memberships | ✅ Required |
| `Directory.Read.All` | Directory data | Access directory objects and relationships | ✅ Required |
| `GroupMember.Read.All` | Group memberships | Read detailed group membership information | ✅ Required |

### Delegated Permissions (Optional)

These permissions are used when users sign in interactively:

| Permission | Scope | Purpose | User Consent |
|------------|-------|---------|--------------|
| `User.Read` | Signed-in user | Read basic profile of signed-in user | ✅ Automatic |
| `Directory.Read.All` | Directory data | Enhanced directory access for signed-in user | 👤 User/Admin |

### Permission Configuration

#### Via Azure Portal
1. Go to **Azure Active Directory** > **App registrations**
2. Select "Group Tree Membership Visualizer"
3. Click **API permissions**
4. Click **+ Add a permission**
5. Select **Microsoft Graph** > **Application permissions**
6. Search for and select each required permission
7. Click **Grant admin consent for [Organization]**

#### Via PowerShell Script
```powershell
# Connect to Microsoft Graph
Connect-MgGraph -Scopes "Application.ReadWrite.All"

# Get your app registration
$app = Get-MgApplication -Filter "displayName eq 'Group Tree Membership Visualizer'"

# Required permissions
$permissions = @(
    "User.Read.All",
    "Group.Read.All", 
    "Directory.Read.All",
    "GroupMember.Read.All"
)

# Grant permissions (requires admin consent)
foreach ($permission in $permissions) {
    # Add permission to app registration
    $graphServicePrincipal = Get-MgServicePrincipal -Filter "appId eq '00000003-0000-0000-c000-000000000000'"
    $permissionRole = $graphServicePrincipal.AppRoles | Where-Object {$_.Value -eq $permission}
    
    New-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $app.Id -PrincipalId $app.Id -ResourceId $graphServicePrincipal.Id -AppRoleId $permissionRole.Id
}
```

## 🏗️ App Registration Configuration

### Authentication Settings

Configure the following in your app registration:

#### Supported Account Types
- **Single tenant**: Users in your organization only
- **Multi-tenant**: Not recommended for this application

#### Redirect URIs
Add these redirect URIs to your app registration:

| Platform | URI | Purpose |
|----------|-----|---------|
| Single Page Application (SPA) | `https://your-app-name.azurestaticapps.net` | Main app authentication |
| Single Page Application (SPA) | `https://your-app-name.azurestaticapps.net/` | Root path authentication |
| Single Page Application (SPA) | `http://localhost:3000` | Local development |

#### Advanced Settings
- **Allow public client flows**: No
- **Default client type**: Public client
- **Supported account types**: Single tenant

### Certificates & Secrets

#### Client Secret Configuration
1. Generate a new client secret with appropriate expiration
2. Copy the secret value immediately (it won't be shown again)
3. Store securely in Azure Static Web App configuration

**Recommended Expiration**: 24 months (balance between security and maintenance)

#### Certificate Alternative (Optional)
For enhanced security, you can use certificates instead of client secrets:

```powershell
# Generate self-signed certificate
$cert = New-SelfSignedCertificate -Subject "CN=GroupVisualizerApp" -CertStoreLocation "Cert:\CurrentUser\My" -KeyExportPolicy Exportable -KeySpec Signature

# Export certificate
Export-Certificate -Cert $cert -FilePath "GroupVisualizerApp.cer"
```

## 🌐 Static Web App Configuration

### Build Configuration

The application uses the following build settings:

```json
{
  "buildProperties": {
    "appLocation": "/",
    "apiLocation": "/api",
    "outputLocation": "out"
  }
}
```

### Custom Domains (Optional)

To use a custom domain:

1. **Add Custom Domain**:
   ```bash
   az staticwebapp hostname set \
     --name "your-app-name" \
     --hostname "groups.yourcompany.com"
   ```

2. **Configure DNS**:
   - Add CNAME record pointing to your Static Web App URL
   - Verify domain ownership

3. **SSL Certificate**:
   - Azure automatically provisions SSL certificates
   - Certificate renewal is handled automatically

### Routing Configuration

The application includes a `staticwebapp.config.json` file for routing:

```json
{
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["authenticated"]
    },
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "auth": {
    "rolesSource": "/api/auth/roles",
    "identityProviders": {
      "azureActiveDirectory": {
        "userDetailsClaim": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
        "registration": {
          "openIdIssuer": "https://login.microsoftonline.com/{tenant-id}/v2.0",
          "clientIdSettingName": "AZURE_CLIENT_ID",
          "clientSecretSettingName": "AZURE_CLIENT_SECRET"
        }
      }
    }
  }
}
```

## 🔍 API Configuration

### Rate Limiting

Microsoft Graph API has rate limits:

| Resource | Limit | Window |
|----------|-------|---------|
| User requests | 2,000 | 5 minutes |
| Group requests | 2,000 | 5 minutes |
| Directory requests | 5,000 | 5 minutes |

### Caching Strategy

The application implements caching to respect rate limits:

```typescript
// Cache configuration
const cacheConfig = {
  users: 300, // 5 minutes
  groups: 600, // 10 minutes
  memberships: 300 // 5 minutes
};
```

### Error Handling

API errors are handled with exponential backoff:

```typescript
const retryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2
};
```

## 🎨 UI Customization

### Theme Configuration

Modify the application theme by updating `globals.css`:

```css
:root {
  /* Primary brand colors */
  --primary-color: #0078d4;
  --secondary-color: #106ebe;
  --accent-color: #005a9e;
  
  /* Background gradients */
  --bg-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  
  /* Glass morphism */
  --glass-bg: rgba(255, 255, 255, 0.25);
  --glass-border: rgba(255, 255, 255, 0.18);
}
```

### Component Styling

The application uses Tailwind CSS with custom components:

```typescript
// Button variants
const buttonStyles = {
  primary: "bg-white/20 hover:bg-white/30 border-white/30",
  secondary: "bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30",
  accent: "bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/30"
};
```

## 🔧 Development Configuration

### Local Development

For local development, create `.env.local`:

```env
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_TENANT_ID=your-tenant-id
DEBUG_MODE=true
```

### TypeScript Configuration

The application uses strict TypeScript settings in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Next.js Configuration

Key Next.js settings in `next.config.js`:

```javascript
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};
```

## 📊 Monitoring Configuration

### Application Insights (Optional)

To enable Application Insights monitoring:

1. Create Application Insights resource
2. Add connection string to environment variables:
   ```
   APPLICATIONINSIGHTS_CONNECTION_STRING=your-connection-string
   ```
3. Install SDK dependencies:
   ```bash
   npm install @azure/monitor-opentelemetry-exporter
   ```

### Health Checks

The application includes health check endpoints:

- `/api/health` - Basic health check
- `/api/debug` - Detailed configuration check
- `/api/auth/test` - Authentication test

## 🛡️ Security Configuration

### Content Security Policy

Recommended CSP headers in `staticwebapp.config.json`:

```json
{
  "globalHeaders": {
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://graph.microsoft.com https://login.microsoftonline.com; img-src 'self' data: https:;"
  }
}
```

### CORS Configuration

Azure Static Web Apps automatically handles CORS for API routes.

### Authentication Security

- Use HTTPS only in production
- Implement proper session management
- Validate all user inputs
- Use least privilege permissions

## 📝 Troubleshooting Common Configuration Issues

### Issue: Authentication Fails
**Solution**: Verify redirect URIs match exactly (including trailing slashes)

### Issue: Permission Denied
**Solution**: Ensure admin consent is granted for all required permissions

### Issue: API Rate Limits
**Solution**: Implement proper caching and retry logic

### Issue: Environment Variables Not Loading
**Solution**: Restart Static Web App after configuration changes

---

For additional help, see the [Troubleshooting Guide](TROUBLESHOOTING.md) or [Setup Guide](SETUP_GUIDE.md).
