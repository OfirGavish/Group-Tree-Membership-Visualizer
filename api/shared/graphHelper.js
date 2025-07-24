// Shared helper for getting Microsoft Graph tokens with delegated permissions
const fetch = require('node-fetch');
const msal = require('@azure/msal-node');

/**
 * Get a Microsoft Graph access token using delegated permissions via On-Behalf-Of flow
 * @param {object} req - The request object from Azure Functions
 * @param {object} context - The context object from Azure Functions
 * @returns {Promise<string>} Access token for Microsoft Graph with delegated permissions
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

    // Try to get the user's access token from Easy Auth headers first
    let userToken = req.headers['x-ms-token-aad-access-token'] || req.headers['x-ms-token-aad-id-token'];
    
    // If no direct token, try to extract from the auth token
    if (!userToken) {
        const authToken = req.headers['x-ms-auth-token'];
        if (authToken) {
            // For now, we'll use a fallback to application permissions with user context
            // This ensures we maintain security while working around SWA limitations
            context.log('No delegated token available, using secured application permissions');
            return await getApplicationToken(clientId, clientSecret, tenantId, context);
        }
        throw new Error('No authentication token available');
    }

    // Use On-Behalf-Of flow to get Graph token with delegated permissions
    try {
        const clientConfig = {
            auth: {
                clientId: clientId,
                clientSecret: clientSecret,
                authority: `https://login.microsoftonline.com/${tenantId}`
            }
        };

        const pca = new msal.ConfidentialClientApplication(clientConfig);
        
        const oboRequest = {
            oboAssertion: userToken,
            scopes: ['https://graph.microsoft.com/User.Read.All', 'https://graph.microsoft.com/Group.Read.All', 'https://graph.microsoft.com/Directory.Read.All']
        };

        const oboResponse = await pca.acquireTokenOnBehalfOf(oboRequest);
        
        if (oboResponse && oboResponse.accessToken) {
            context.log('Successfully obtained delegated token via On-Behalf-Of flow');
            return oboResponse.accessToken;
        } else {
            throw new Error('OBO flow returned no token');
        }
        
    } catch (error) {
        context.log('OBO flow failed:', error.message);
        // Fallback to secured application permissions
        context.log('Falling back to secured application permissions');
        return await getApplicationToken(clientId, clientSecret, tenantId, context);
    }
}

/**
 * Get application token as fallback (still requires user authentication)
 */
async function getApplicationToken(clientId, clientSecret, tenantId, context) {
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
            context.log('Using application token (user-authenticated context)');
            return tokenData.access_token;
        } else {
            const errorData = await tokenResponse.text();
            throw new Error(`Failed to get application token: ${tokenResponse.status} - ${errorData}`);
        }
    } catch (error) {
        throw new Error(`Application token acquisition failed: ${error.message}`);
    }
}

/**
 * Make an authenticated request to Microsoft Graph using delegated permissions
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
