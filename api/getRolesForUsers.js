const { app } = require('@azure/functions');

// Simple role assignment API for Azure Static Web Apps
app.http('getRolesForUsers', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Role assignment request received');

        try {
            // Get user information from the request headers
            const clientPrincipal = request.headers['x-ms-client-principal'];
            
            if (!clientPrincipal) {
                context.log('No client principal found - assigning default role');
                // Even without client principal, assign authenticated role
                return {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        roles: ['authenticated']
                    })
                };
            }

            // Decode the client principal (it's base64 encoded)
            let principal;
            try {
                principal = JSON.parse(Buffer.from(clientPrincipal, 'base64').toString());
                context.log('User principal decoded successfully');
            } catch (decodeError) {
                context.log('Error decoding client principal, using default role');
                return {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        roles: ['authenticated']
                    })
                };
            }

            // For this app, all authenticated users get the 'authenticated' role
            const roles = ['authenticated'];

            // Optionally, check for admin users based on email domain
            if (principal.userDetails) {
                context.log('User details:', principal.userDetails);
                if (principal.userDetails.includes('@mscloudninja.com')) {
                    roles.push('admin');
                    context.log('Admin role assigned');
                }
            }

            context.log('Final assigned roles:', roles);

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    roles: roles
                })
            };

        } catch (error) {
            context.log.error('Error in role assignment:', error);
            
            // Even on error, return a default role to avoid blocking access
            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    roles: ['authenticated']
                })
            };
        }
    }
});
