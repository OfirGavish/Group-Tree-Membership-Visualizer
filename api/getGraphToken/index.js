// Get Microsoft Graph access token for delegated permissions
const fetch = require('node-fetch');

module.exports = async function (context, req) {
    context.log('Get Graph Token request received');

    try {
        // Check if user is authenticated
        const clientPrincipal = req.headers['x-ms-client-principal'];
        if (!clientPrincipal) {
            context.res = {
                status: 401,
                body: { error: 'User not authenticated' }
            };
            return;
        }

        // Decode client principal
        const principal = JSON.parse(Buffer.from(clientPrincipal, 'base64').toString());
        
        // Environment variables
        const clientId = process.env.AZURE_CLIENT_ID;
        const clientSecret = process.env.AZURE_CLIENT_SECRET;
        const tenantId = process.env.AZURE_TENANT_ID;

        if (!clientId || !clientSecret || !tenantId) {
            context.res = {
                status: 500,
                body: { error: 'Missing Azure AD configuration' }
            };
            return;
        }

        // Check if we have an existing access token in Easy Auth
        const easyAuthToken = req.headers['x-ms-token-aad-access-token'];
        if (easyAuthToken) {
            // We have a token, let's verify it's for Microsoft Graph
            try {
                const testResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
                    headers: {
                        'Authorization': `Bearer ${easyAuthToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (testResponse.ok) {
                    // Token works for Graph API
                    context.res = {
                        status: 200,
                        body: { 
                            access_token: easyAuthToken,
                            source: 'easy-auth',
                            expires_in: 3600 // Default assumption
                        }
                    };
                    return;
                }
            } catch (error) {
                context.log('Easy Auth token test failed:', error.message);
            }
        }

        // Try to get a fresh token using On-Behalf-Of flow
        // First, we need to get the user's token from Easy Auth
        const idToken = req.headers['x-ms-token-aad-id-token'] || req.headers['x-ms-auth-token'];
        
        if (idToken) {
            try {
                // Use On-Behalf-Of flow to exchange the ID token for a Graph access token
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
                    context.res = {
                        status: 200,
                        body: {
                            access_token: tokenData.access_token,
                            source: 'on-behalf-of',
                            expires_in: tokenData.expires_in || 3600
                        }
                    };
                    return;
                } else {
                    const errorData = await tokenResponse.text();
                    context.log('On-Behalf-Of token request failed:', errorData);
                }
            } catch (error) {
                context.log('On-Behalf-Of flow error:', error.message);
            }
        }

        // Fallback: Try to use client credentials with application permissions
        // This is not ideal for delegated scenarios but ensures functionality
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
                context.res = {
                    status: 200,
                    body: {
                        access_token: tokenData.access_token,
                        source: 'client-credentials-fallback',
                        expires_in: tokenData.expires_in || 3600,
                        warning: 'Using application permissions as fallback - some operations may be limited'
                    }
                };
                return;
            }
        } catch (error) {
            context.log('Client credentials fallback failed:', error.message);
        }

        // All methods failed
        context.res = {
            status: 500,
            body: { 
                error: 'Unable to obtain Microsoft Graph access token',
                details: 'All token acquisition methods failed',
                user: principal.userDetails,
                availableHeaders: Object.keys(req.headers).filter(h => h.startsWith('x-ms'))
            }
        };

    } catch (error) {
        context.log('Error in getGraphToken:', error);
        context.res = {
            status: 500,
            body: { error: 'Internal server error', details: error.message }
        };
    }
};
