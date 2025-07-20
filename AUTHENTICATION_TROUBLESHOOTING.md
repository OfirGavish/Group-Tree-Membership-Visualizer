# Azure Static Web App Authentication Troubleshooting Guide

## Current Configuration Status ✅
- **Azure AD App Registration**: Created
- **Client ID**: 4c4814af-7b2a-4a96-bed9-59c394641f29  
- **Client Secret**: Configured
- **Environment Variables**: Added to Static Web App

## Testing Steps

### 1. Force Authentication Test
Try visiting these URLs directly:

**Login URL:**
```
https://YOUR_STATIC_WEB_APP_URL/.auth/login/aad
```

**Auth Info URL (after login):**
```
https://YOUR_STATIC_WEB_APP_URL/.auth/me
```

### 2. Check Environment Variables
In Azure Portal:
1. Go to Static Web Apps → Your App
2. Settings → Environment variables
3. Verify both variables are present:
   - `AZURE_CLIENT_ID`
   - `AZURE_CLIENT_SECRET`

### 3. Verify App Registration
In Azure Portal:
1. Go to Azure Active Directory → App registrations
2. Find "Group Tree Membership Visualizer"
3. Check **Authentication** → Web → Redirect URIs:
   - Should include: `https://YOUR_STATIC_WEB_APP_URL/.auth/login/aad/callback`

### 4. Grant Admin Consent (if needed)
If you see consent prompts:
1. Azure Active Directory → App registrations → Group Tree Membership Visualizer
2. API permissions → Grant admin consent for [Your Organization]

## Common Issues & Solutions

### Issue: "AADSTS50011: Reply URL mismatch"
**Solution**: Check redirect URI matches exactly:
- Static Web App URL format: `https://app-name.azurestaticapps.net`
- Redirect URI: `https://app-name.azurestaticapps.net/.auth/login/aad/callback`

### Issue: "AADSTS65001: User consent required"
**Solution**: Grant admin consent or enable user consent in Azure AD

### Issue: Still getting 401 after configuration
**Solution**: 
1. Clear browser cache/cookies
2. Try incognito/private browsing
3. Wait 5-10 minutes for configuration to propagate

## Verification Commands

Check your current configuration:
```bash
# Verify app registration
az ad app show --id 4c4814af-7b2a-4a96-bed9-59c394641f29

# Check API permissions
az ad app permission list --id 4c4814af-7b2a-4a96-bed9-59c394641f29
```

## Next Steps

1. **Test the login flow**: Visit `/.auth/login/aad`
2. **Check auth status**: Visit `/.auth/me` after login  
3. **Verify permissions**: Ensure Microsoft Graph permissions are granted
4. **Test the app**: Try using the main application features

If issues persist, check browser developer tools for specific error messages.
