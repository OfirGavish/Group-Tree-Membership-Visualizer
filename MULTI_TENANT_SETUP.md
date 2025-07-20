# 🌍 Multi-Tenant Group Tree Visualizer Setup

## Key Differences from Single-Tenant Version

The multi-tenant version allows administrators from **any Azure AD tenant** to:
- Sign in with their organizational account
- View their own tenant's group hierarchy
- Access only their tenant's data (isolated by design)

## Architecture Changes

### 1. Authentication Configuration
- **Single-tenant**: `"supportedAccountTypes": "AzureADMyOrg"`
- **Multi-tenant**: `"supportedAccountTypes": "AzureADMultipleOrgs"`

### 2. App Registration Requirements
- Must be registered in a "home" tenant (yours)
- Requires admin consent from each tenant that wants to use it
- Different permission model for cross-tenant access

### 3. Tenant Isolation
- Each user only sees their own tenant's data
- Tenant ID is automatically detected from the user's token
- No cross-tenant data leakage

## Step-by-Step Multi-Tenant Setup

### Phase 1: Switch to Multi-Tenant Code

1. **Update your main page to use multi-tenant version**:
```bash
# Backup current single-tenant version
cp src/app/page.tsx src/app/page-single-tenant.tsx

# Switch to multi-tenant page
cp src/app/multi-tenant-page.tsx src/app/page.tsx
```

2. **Update Static Web App configuration**:
```bash
# Backup current config
cp public/staticwebapp.config.json public/staticwebapp.config.single-tenant.json

# Use multi-tenant config
cp public/staticwebapp.config.multitenant.json public/staticwebapp.config.json
```

### Phase 2: Deploy Multi-Tenant Version

1. **Build and deploy** (same as single-tenant):
```bash
npm run build
```

2. **Push to GitHub**:
```bash
git add .
git commit -m "Multi-tenant version"
git push
```

### Phase 3: Configure Multi-Tenant App Registration

1. **Go to Azure Portal** → **Azure Active Directory** → **App registrations**
2. **Find your app** (created by Static Web Apps)
3. **Go to Authentication** → **Supported account types**
4. **Select**: "Accounts in any organizational directory (Any Azure AD directory - Multitenant)"
5. **Save**

### Phase 4: Update Microsoft Graph Permissions

The multi-tenant app needs these **Application permissions** (not just Delegated):

1. **Go to API permissions**
2. **Add permissions** → **Microsoft Graph** → **Application permissions**
3. **Add these permissions**:
   - `User.Read.All` - Read all users' full profiles
   - `Group.Read.All` - Read all groups
   - `Directory.Read.All` - Read directory data
   - `GroupMember.Read.All` - Read group memberships

4. **Grant admin consent for your tenant**

### Phase 5: Publisher Verification (Recommended)

For production multi-tenant apps:

1. **Go to Branding** in your app registration
2. **Complete publisher verification**
3. **This removes the "unverified" warning** for other tenants

## How Other Tenants Can Use Your App

### For Tenant Administrators:

1. **Visit your app URL**: `https://your-app.azurestaticapps.net`
2. **Click "Sign in with Microsoft"**
3. **Azure will prompt for admin consent** (first time only)
4. **Admin grants consent** for their tenant
5. **Users in that tenant can now use the app**

### Admin Consent Process:

When a user from a new tenant first tries to sign in, they'll see:
```
[App Name] wants to:
✓ Read all users' full profiles
✓ Read all groups
✓ Read directory data
✓ Read group memberships

This app will be able to access this data even when you are not using it.

[Cancel] [Accept]
```

**Only tenant administrators can grant this consent.**

## User Experience by Role

### For Administrators:
- ✅ Can search and view any user in their tenant
- ✅ Can see complete group hierarchies
- ✅ Full access to all features

### For Regular Users:
- ✅ Can sign in and use the app
- ⚠️ Can only see their own group memberships
- ❌ Cannot search for other users

## Security & Compliance

### Data Isolation:
- **Each tenant's data is completely isolated**
- **Users can only access their own tenant's information**
- **No cross-tenant data access possible**

### Permissions Model:
- **Application permissions**: Required for admin features
- **Delegated permissions**: Used for user-specific data
- **Tenant-scoped**: All permissions are limited to the user's tenant

### Audit & Compliance:
- **All API calls are logged** in each tenant's audit logs
- **Tenant administrators can monitor usage**
- **Complies with data residency requirements**

## Cost Considerations

### Azure Static Web Apps:
- **Free tier**: 100GB bandwidth, 0.5GB storage
- **Standard tier**: For custom domains and advanced features

### Microsoft Graph API:
- **Free**: Within standard usage limits
- **Throttling**: Applies per tenant, not globally

### App Registration:
- **Free**: No additional cost for multi-tenant apps

## Monitoring & Analytics

### Per-Tenant Usage:
```bash
# View Sign-ins per tenant
Azure Portal → Azure AD → Sign-ins → Filter by Application
```

### API Usage:
```bash
# Monitor Graph API calls
Azure Portal → Azure AD → Audit logs → Filter by Application
```

## Troubleshooting Multi-Tenant Issues

### "Need admin approval" error:
- **Solution**: Tenant admin must grant consent first
- **Check**: App requires application permissions

### "User not found" error:
- **Solution**: Verify user exists in their tenant (not yours)
- **Check**: Cross-tenant confusion

### "Insufficient privileges" error:
- **Solution**: Check if user has necessary roles in their tenant
- **Check**: Admin permissions for user management features

## Next Steps

After successful multi-tenant deployment:

1. **Documentation**: Create tenant admin guide
2. **Marketing**: List your app in Microsoft AppSource
3. **Support**: Set up support process for multiple tenants
4. **Compliance**: Review data processing agreements

## Comparison: Single vs Multi-Tenant

| Feature | Single-Tenant | Multi-Tenant |
|---------|---------------|--------------|
| **Deployment** | One per tenant | One for all tenants |
| **Maintenance** | Per-tenant updates | Single update |
| **App Registration** | Per tenant | One registration |
| **Admin Consent** | Once (your tenant) | Per tenant |
| **Data Isolation** | By deployment | By code logic |
| **Scalability** | Limited | High |
| **Complexity** | Lower | Higher |

The multi-tenant approach is perfect for **SaaS scenarios** where you want to provide the same service to multiple organizations! 🚀
