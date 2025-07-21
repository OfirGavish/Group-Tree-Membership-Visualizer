const { app } = require('@azure/functions');

// Role assignment API for Azure Static Web Apps
// This endpoint returns roles for authenticated users
app.http('getRolesForUsers', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Role assignment request received');

        try {
            // Get user information from the request headers
            const clientPrincipal = request.headers['x-ms-client-principal'];
            
            if (!clientPrincipal) {
                context.log('No client principal found');
                return {
                    status: 401,
                    body: JSON.stringify({ error: 'Unauthorized' })
                };
            }

            // Decode the client principal (it's base64 encoded)
            const principal = JSON.parse(Buffer.from(clientPrincipal, 'base64').toString());
            
            context.log('User principal:', principal);

            // For this app, all authenticated users get the 'authenticated' role
            // You could add logic here to assign different roles based on user properties
            const roles = ['authenticated'];

            // Optionally, you could check for admin users and assign additional roles
            // For example, checking if user is in a specific group or has a specific domain
            const userEmail = principal.userDetails;
            if (userEmail && userEmail.includes('@mscloudninja.com')) {
                roles.push('admin');
            }

            context.log('Assigned roles:', roles);

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
            
            return {
                status: 500,
                body: JSON.stringify({ 
                    error: 'Internal server error',
                    message: error.message 
                })
            };
        }
    }
});
