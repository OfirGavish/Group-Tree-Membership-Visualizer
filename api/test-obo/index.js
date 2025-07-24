const msal = require('@azure/msal-node');

module.exports = async function (context, req) {
    const debug = [];
    
    try {
        // Configuration
        const clientConfig = {
            auth: {
                clientId: process.env.AZURE_CLIENT_ID,
                clientSecret: process.env.AZURE_CLIENT_SECRET,
                authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`
            }
        };
        
        debug.push(`Client ID: ${process.env.AZURE_CLIENT_ID}`);
        debug.push(`Tenant ID: ${process.env.AZURE_TENANT_ID}`);
        debug.push(`Client Secret exists: ${!!process.env.AZURE_CLIENT_SECRET}`);
        
        // Analyze all available tokens
        const headers = req.headers;
        debug.push(`Available headers: ${Object.keys(headers).join(', ')}`);
        
        const authHeaders = [
            'x-ms-client-principal',
            'x-ms-client-principal-id',
            'x-ms-client-principal-name',
            'x-ms-client-principal-idp',
            'x-ms-token-aad-id-token',
            'x-ms-token-aad-access-token',
            'x-ms-token-aad-refresh-token',
            'authorization'
        ];
        
        const availableTokens = {};
        authHeaders.forEach(header => {
            if (headers[header]) {
                availableTokens[header] = headers[header];
            }
        });
        
        debug.push(`Available auth headers: ${Object.keys(availableTokens).join(', ')}`);
        
        // Try to get the ID token for OBO flow
        let idToken = null;
        let accessToken = null;
        
        if (headers['x-ms-token-aad-id-token']) {
            idToken = headers['x-ms-token-aad-id-token'];
            debug.push('Found ID token in x-ms-token-aad-id-token');
        }
        
        if (headers['x-ms-token-aad-access-token']) {
            accessToken = headers['x-ms-token-aad-access-token'];
            debug.push('Found access token in x-ms-token-aad-access-token');
        }
        
        // Parse client principal if available
        let clientPrincipal = null;
        if (headers['x-ms-client-principal']) {
            try {
                const principalData = Buffer.from(headers['x-ms-client-principal'], 'base64').toString();
                clientPrincipal = JSON.parse(principalData);
                debug.push(`Client principal parsed successfully`);
                debug.push(`Principal claims count: ${clientPrincipal.claims?.length || 0}`);
            } catch (e) {
                debug.push(`Failed to parse client principal: ${e.message}`);
            }
        }
        
        // Test different OBO approaches
        const oboResults = {};
        
        // Create MSAL client
        const pca = new msal.ConfidentialClientApplication(clientConfig);
        
        // Approach 1: Use ID token for OBO
        if (idToken) {
            try {
                debug.push('Attempting OBO with ID token...');
                const oboRequest = {
                    oboAssertion: idToken,
                    scopes: ['https://graph.microsoft.com/User.Read.All'],
                };
                
                const oboResponse = await pca.acquireTokenOnBehalfOf(oboRequest);
                oboResults.idTokenOBO = {
                    success: true,
                    accessToken: oboResponse.accessToken?.substring(0, 50) + '...',
                    scopes: oboResponse.scopes,
                    expiresOn: oboResponse.expiresOn
                };
                debug.push('ID token OBO successful');
            } catch (error) {
                oboResults.idTokenOBO = {
                    success: false,
                    error: error.message,
                    errorCode: error.errorCode,
                    errorSubCode: error.errorSubCode
                };
                debug.push(`ID token OBO failed: ${error.message}`);
            }
        }
        
        // Approach 2: Use access token for OBO
        if (accessToken) {
            try {
                debug.push('Attempting OBO with access token...');
                const oboRequest = {
                    oboAssertion: accessToken,
                    scopes: ['https://graph.microsoft.com/User.Read.All'],
                };
                
                const oboResponse = await pca.acquireTokenOnBehalfOf(oboRequest);
                oboResults.accessTokenOBO = {
                    success: true,
                    accessToken: oboResponse.accessToken?.substring(0, 50) + '...',
                    scopes: oboResponse.scopes,
                    expiresOn: oboResponse.expiresOn
                };
                debug.push('Access token OBO successful');
            } catch (error) {
                oboResults.accessTokenOBO = {
                    success: false,
                    error: error.message,
                    errorCode: error.errorCode,
                    errorSubCode: error.errorSubCode
                };
                debug.push(`Access token OBO failed: ${error.message}`);
            }
        }
        
        // Approach 3: Extract token from client principal claims
        if (clientPrincipal?.claims) {
            const accessTokenClaim = clientPrincipal.claims.find(c => 
                c.typ === 'access_token' || c.typ === 'aio' || c.typ === 'aud'
            );
            
            if (accessTokenClaim) {
                debug.push(`Found claim with type: ${accessTokenClaim.typ}`);
            }
        }
        
        // Test Graph API call if we got a token
        let graphTestResult = null;
        const successfulOBO = Object.values(oboResults).find(r => r.success);
        
        if (successfulOBO) {
            try {
                debug.push('Testing Graph API call with OBO token...');
                const response = await fetch('https://graph.microsoft.com/v1.0/me', {
                    headers: {
                        'Authorization': `Bearer ${successfulOBO.accessToken.replace('...', '')}`
                    }
                });
                
                if (response.ok) {
                    const userData = await response.json();
                    graphTestResult = {
                        success: true,
                        userDisplayName: userData.displayName,
                        userPrincipalName: userData.userPrincipalName
                    };
                    debug.push('Graph API call successful');
                } else {
                    graphTestResult = {
                        success: false,
                        status: response.status,
                        statusText: response.statusText
                    };
                    debug.push(`Graph API call failed: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                graphTestResult = {
                    success: false,
                    error: error.message
                };
                debug.push(`Graph API call error: ${error.message}`);
            }
        }
        
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                debug: debug,
                availableTokens: Object.keys(availableTokens),
                clientPrincipal: clientPrincipal ? {
                    userId: clientPrincipal.userId,
                    userRoles: clientPrincipal.userRoles,
                    identityProvider: clientPrincipal.identityProvider,
                    claimsCount: clientPrincipal.claims?.length || 0
                } : null,
                oboResults: oboResults,
                graphTestResult: graphTestResult,
                recommendations: [
                    successfulOBO ? 'OBO flow working - use this approach' : 'OBO flow failed - check token format',
                    idToken ? 'ID token available for OBO' : 'No ID token found',
                    accessToken ? 'Access token available for OBO' : 'No access token found',
                    'Check Azure AD app registration for OBO permissions'
                ]
            }, null, 2)
        };
        
    } catch (error) {
        debug.push(`Critical error: ${error.message}`);
        
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: false,
                error: error.message,
                debug: debug
            }, null, 2)
        };
    }
};
