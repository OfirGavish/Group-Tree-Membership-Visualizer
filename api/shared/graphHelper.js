// Shared helper for getting Microsoft Graph tokens with delegated permissions
const fetch = require('node-fetch');

/**
 * Get a Microsoft Graph access token for the authenticated user
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

    // First, check if Easy Auth provided a Graph token
    const easyAuthToken = req.headers['x-ms-token-aad-access-token'];
    if (easyAuthToken) {
        try {
            // Test if the token works with Microsoft Graph
            const testResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
                headers: {
                    'Authorization': `Bearer ${easyAuthToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (testResponse.ok) {
                context.log('Using Easy Auth provided Graph token');
                return easyAuthToken;
            }
        } catch (error) {
            context.log('Easy Auth token test failed:', error.message);
        }
    }

    // Try On-Behalf-Of flow with ID token
    const idToken = req.headers['x-ms-token-aad-id-token'] || req.headers['x-ms-auth-token'];
    
    if (idToken) {
        try {
            const tokenRequest = {
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                client_id: clientId,
                client_secret: clientSecret,
                assertion: idToken,
                scope: 'https://graph.microsoft.com/User.Read https://graph.microsoft.com/User.Read.All https://graph.microsoft.com/Group.Read.All https://graph.microsoft.com/Device.Read.All https://graph.microsoft.com/Directory.Read.All',
                requested_token_use: 'on_behalf_of'
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
                context.log('Successfully obtained token via On-Behalf-Of flow');
                return tokenData.access_token;
            } else {
                const errorData = await tokenResponse.text();
                context.log('On-Behalf-Of token request failed:', errorData);
            }
        } catch (error) {
            context.log('On-Behalf-Of flow error:', error.message);
        }
    }

    // If we get here, we couldn't get a delegated token
    throw new Error('Unable to obtain delegated Microsoft Graph access token. Please ensure the Azure AD app is configured with the required permissions and that the user has consented.');
}

/**
 * Make an authenticated request to Microsoft Graph
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
