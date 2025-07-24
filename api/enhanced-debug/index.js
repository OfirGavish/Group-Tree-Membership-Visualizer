// Enhanced debug endpoint to check token scopes and permissions
const fetch = require('node-fetch');

module.exports = async function (context, req) {
    context.log('Enhanced debug request received');

    try {
        // Check environment variables
        const clientId = process.env.AZURE_CLIENT_ID;
        const clientSecret = process.env.AZURE_CLIENT_SECRET ? 'SET' : 'NOT SET';
        const tenantId = process.env.AZURE_TENANT_ID;

        // Check authentication
        const clientPrincipal = req.headers['x-ms-client-principal'];
        let authInfo = 'No client principal found';
        
        if (clientPrincipal) {
            try {
                const principal = JSON.parse(Buffer.from(clientPrincipal, 'base64').toString());
                authInfo = {
                    userId: principal.userId,
                    userDetails: principal.userDetails,
                    identityProvider: principal.identityProvider,
                    claims: principal.claims || 'No claims found'
                };
            } catch (e) {
                authInfo = 'Error decoding client principal';
            }
        }

        // Check user's delegated token
        const userToken = req.headers['x-ms-token-aad-access-token'];
        const authHeader = req.headers['authorization'];
        const authToken = req.headers['x-ms-auth-token'];
        const allHeaders = Object.keys(req.headers).filter(h => h.startsWith('x-ms')).reduce((acc, key) => {
            acc[key] = req.headers[key] ? 'Present' : 'Not present';
            return acc;
        }, {});
        
        let tokenInfo = {
            userToken: userToken ? 'Present' : 'Not present',
            authHeader: authHeader ? 'Present' : 'Not present',
            authToken: authToken ? 'Present' : 'Not present',
            msHeaders: allHeaders
        };
        let tokenScopes = 'No scopes found';
        let meApiTest = 'Not tested';
        let usersApiTest = 'Not tested';
        
        // Try to decode the x-ms-auth-token to see what it contains
        if (authToken) {
            try {
                const tokenParts = authToken.split('.');
                if (tokenParts.length === 3) {
                    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
                    tokenInfo.authTokenInfo = {
                        audience: payload.aud,
                        issuer: payload.iss,
                        scopes: payload.scp || payload.scope || payload.roles || 'No scopes found',
                        appId: payload.appid,
                        expires: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'Unknown'
                    };
                }
            } catch (error) {
                tokenInfo.authTokenDecodeError = error.message;
            }
        }
        
        if (userToken) {
            tokenInfo.status = 'User token present';
            
            // Test calling /me endpoint
            try {
                const meResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
                    headers: {
                        'Authorization': `Bearer ${userToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (meResponse.ok) {
                    const meData = await meResponse.json();
                    meApiTest = `Success - Got user: ${meData.displayName} (${meData.userPrincipalName})`;
                } else {
                    const errorText = await meResponse.text();
                    meApiTest = `Failed - HTTP ${meResponse.status}: ${errorText}`;
                }
            } catch (error) {
                meApiTest = `Error: ${error.message}`;
            }
            
            // Test calling /users endpoint
            try {
                const usersResponse = await fetch('https://graph.microsoft.com/v1.0/users?$top=5&$select=displayName,userPrincipalName', {
                    headers: {
                        'Authorization': `Bearer ${userToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (usersResponse.ok) {
                    const usersData = await usersResponse.json();
                    usersApiTest = `Success - Found ${usersData.value.length} users`;
                } else {
                    const errorText = await usersResponse.text();
                    usersApiTest = `Failed - HTTP ${usersResponse.status}: ${errorText}`;
                }
            } catch (error) {
                usersApiTest = `Error: ${error.message}`;
            }
            
            // Try to decode token to see scopes (basic JWT decode)
            try {
                const tokenParts = userToken.split('.');
                if (tokenParts.length === 3) {
                    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
                    tokenScopes = payload.scp || payload.scope || 'No scope claim found';
                }
            } catch (error) {
                tokenScopes = `Error decoding token: ${error.message}`;
            }
        } else if (authToken) {
            // Try using the x-ms-auth-token as a fallback
            tokenInfo.status = 'Trying x-ms-auth-token as fallback';
            
            // Test calling /me endpoint with auth token
            try {
                const meResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (meResponse.ok) {
                    const meData = await meResponse.json();
                    meApiTest = `Success with auth token - Got user: ${meData.displayName} (${meData.userPrincipalName})`;
                } else {
                    const errorText = await meResponse.text();
                    meApiTest = `Failed with auth token - HTTP ${meResponse.status}: ${errorText}`;
                }
            } catch (error) {
                meApiTest = `Error with auth token: ${error.message}`;
            }
            
            // Test calling /users endpoint with auth token
            try {
                const usersResponse = await fetch('https://graph.microsoft.com/v1.0/users?$top=5&$select=displayName,userPrincipalName', {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (usersResponse.ok) {
                    const usersData = await usersResponse.json();
                    usersApiTest = `Success with auth token - Found ${usersData.value.length} users`;
                } else {
                    const errorText = await usersResponse.text();
                    usersApiTest = `Failed with auth token - HTTP ${usersResponse.status}: ${errorText}`;
                }
            } catch (error) {
                usersApiTest = `Error with auth token: ${error.message}`;
            }
        }

        // Test application token (for comparison)
        let appTokenTest = 'Not tested';
        if (clientId && process.env.AZURE_CLIENT_SECRET && tenantId) {
            try {
                const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        client_id: clientId,
                        client_secret: process.env.AZURE_CLIENT_SECRET,
                        scope: 'https://graph.microsoft.com/.default',
                        grant_type: 'client_credentials'
                    })
                });

                if (tokenResponse.ok) {
                    const tokenData = await tokenResponse.json();
                    appTokenTest = `Success - App token received with scope: ${tokenData.scope || 'Unknown'}`;
                } else {
                    const errorText = await tokenResponse.text();
                    appTokenTest = `Failed - HTTP ${tokenResponse.status}: ${errorText}`;
                }
            } catch (error) {
                appTokenTest = `Error: ${error.message}`;
            }
        }

        // Return comprehensive debug info
        context.res = {
            status: 200,
            body: {
                timestamp: new Date().toISOString(),
                environment: {
                    clientId: clientId,
                    clientSecret: clientSecret,
                    tenantId: tenantId
                },
                authentication: authInfo,
                userToken: {
                    present: !!userToken,
                    info: tokenInfo,
                    scopes: tokenScopes,
                    meApiTest: meApiTest,
                    usersApiTest: usersApiTest
                },
                applicationToken: {
                    test: appTokenTest
                }
            }
        };

    } catch (error) {
        context.log('Error in enhanced debug:', error);
        context.res = {
            status: 500,
            body: {
                error: 'Internal server error',
                details: error.message,
                timestamp: new Date().toISOString()
            }
        };
    }
};
