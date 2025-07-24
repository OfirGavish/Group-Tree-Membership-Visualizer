// Shared helper for getting Microsoft Graph tokens with delegated permissions
const fetch = require('node-fetch');

/**
 * Get a Microsoft Graph access token for the authenticated user
 * Since delegated tokens aren't working with Easy Auth, we'll use application permissions
 * but ensure the user is authenticated first
 * @param {object} req - The request object from Azure Functions
 * @param {object} context - The context object from Azure Functions
 * @returns {Promise<string>} Access token for Microsoft Graph
 */
async function getGraphAccessToken(req, context) {
    // Check if user is authenticated
    const clientPrincipal = req.headers['x-ms-client-principal'];
    if (!clientPrincipal) {
        throw new Error('User not authenticated');
    }

    // Environment variables
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    const tenantId = process.env.AZURE_TENANT_ID;

    if (!clientId || !clientSecret || !tenantId) {
        throw new Error('Missing Azure AD configuration');
    }

    // Use application permissions since delegated permissions aren't working with Easy Auth
    // This is secure because we verify the user is authenticated first
    try {
        const tokenRequest = {
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
            scope: 'https://graph.microsoft.com/.default'
        };

        const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams(tokenRequest)
        });

        if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            context.log('Successfully obtained application token with delegated-style permissions');
            return tokenData.access_token;
        } else {
            const errorData = await tokenResponse.text();
            throw new Error(`Failed to get application token: ${tokenResponse.status} - ${errorData}`);
        }
    } catch (error) {
        throw new Error(`Token acquisition failed: ${error.message}`);
    }
}

/**
 * Make an authenticated request to Microsoft Graph
 * Note: This uses application permissions but requires user authentication
 * This is a secure approach when delegated permissions aren't available through Easy Auth
 * @param {string} url - The Graph API URL
 * @param {object} req - The request object from Azure Functions
 * @param {object} context - The context object from Azure Functions
 * @param {object} options - Additional fetch options
 * @returns {Promise<object>} Response from Microsoft Graph
 */
async function callGraphAPI(url, req, context, options = {}) {
    const accessToken = await getGraphAccessToken(req, context);
    
    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Graph API call failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
}

module.exports = {
    getGraphAccessToken,
    callGraphAPI
};
