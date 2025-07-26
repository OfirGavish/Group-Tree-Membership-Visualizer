// Shared helper for getting Microsoft Graph tokens with delegated permissions
const fetch = require('node-fetch');
const msal = require('@azure/msal-node');

/**
 * Get a Microsoft Graph access token using delegated permissions
 * @param {object} req - The request object from Azure Functions
 * @param {object} context - The context object from Azure Functions
 * @returns {Promise<string>} Access token for Microsoft Graph with delegated permissions
 */
async function getGraphAccessToken(req, context) {
    // Log all headers for debugging
    context.log('Request headers:', Object.keys(req.headers));
    context.log('Looking for x-delegated-access-token header...');
    
    // First, check for client-side delegated token (MSAL.js)
    const delegatedToken = req.headers['x-delegated-access-token'];
    if (delegatedToken) {
        context.log('Using client-side delegated access token');
        return delegatedToken;
    }

    // Fallback: Check if user is authenticated via Easy Auth (legacy)
    const clientPrincipal = req.headers['x-ms-client-principal'];
    if (!clientPrincipal) {
        context.log('No x-delegated-access-token found and no Easy Auth principal');
        throw new Error('No delegated token provided. Please ensure user is signed in via MSAL.js.');
    }

    // Environment variables for fallback
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    const tenantId = process.env.AZURE_TENANT_ID;

    if (!clientId || !clientSecret || !tenantId) {
        throw new Error('Missing Azure AD configuration');
    }

    // Try to get the user's access token from Easy Auth headers
    let userToken = req.headers['x-ms-token-aad-access-token'] || req.headers['x-ms-token-aad-id-token'];
    
    // If no direct token, try to extract from the auth token
    if (!userToken) {
        const authToken = req.headers['x-ms-auth-token'];
        if (authToken) {
            // Log warning about fallback
            context.log.warn('No delegated token available from client or Easy Auth. This should not happen with MSAL.js implementation.');
            throw new Error('No delegated token available - please ensure user is signed in via MSAL.js');
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
            scopes: [
                'https://graph.microsoft.com/User.Read.All', 
                'https://graph.microsoft.com/Group.Read.All', 
                'https://graph.microsoft.com/Group.ReadWrite.All',  // Added for group membership management
                'https://graph.microsoft.com/Directory.Read.All'
            ]
        };

        const oboResponse = await pca.acquireTokenOnBehalfOf(oboRequest);
        
        if (oboResponse && oboResponse.accessToken) {
            context.log('Successfully obtained delegated token via On-Behalf-Of flow');
            return oboResponse.accessToken;
        } else {
            throw new Error('OBO flow returned no token');
        }
        
    } catch (error) {
        context.log.error('OBO flow failed:', error.message);
        // No fallback - we require delegated permissions only
        throw new Error(`Delegated token acquisition failed: ${error.message}. Please ensure user is signed in with MSAL.js and has proper permissions.`);
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

    // Check if response has content before trying to parse JSON
    const contentLength = response.headers.get('content-length');
    const contentType = response.headers.get('content-type');
    
    context.log(`Graph API response: ${response.status}, Content-Length: ${contentLength}, Content-Type: ${contentType}`);
    
    // If no content or content-length is 0, return empty object
    if (contentLength === '0' || response.status === 204) {
        context.log('Graph API returned no content (success)');
        return {};
    }
    
    // If there's content, try to parse as JSON
    try {
        return await response.json();
    } catch (error) {
        context.log('Warning: Failed to parse response as JSON, but API call succeeded');
        return {};
    }
}

module.exports = {
    getGraphAccessToken,
    callGraphAPI
};
