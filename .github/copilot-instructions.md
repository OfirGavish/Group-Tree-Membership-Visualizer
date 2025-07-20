<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Group Tree Membership Visualizer - Copilot Instructions

## Project Overview
This is a Next.js TypeScript web application that visualizes Entra ID (Azure AD) group memberships and hierarchies. Users can search for people in their organization and see their group memberships in an interactive tree visualization.

## Key Technologies
- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Authentication**: Microsoft MSAL (Microsoft Authentication Library)
- **API Integration**: Microsoft Graph API for Entra ID data
- **Visualization**: D3.js for interactive tree diagrams
- **UI Components**: Custom React components with Tailwind styling

## Architecture
- `src/app/`: Next.js App Router pages and layouts
- `src/components/`: Reusable React components
- `src/lib/`: Utility functions and services (Graph API, authentication)
- `src/types/`: TypeScript type definitions

## Authentication Flow
1. Users sign in with Microsoft OAuth
2. App requests permissions for reading users and groups
3. Microsoft Graph client is initialized with user token
4. API calls are made to retrieve group membership data

## Key Features
- Interactive tree visualization of group hierarchies
- User search with autocomplete
- Drill-down capability for group details
- Support for nested group memberships
- Responsive design for various screen sizes

## Development Guidelines
- Follow TypeScript best practices with proper type definitions
- Use Tailwind CSS for styling (utility-first approach)
- Implement proper error handling for Graph API calls
- Ensure responsive design across devices
- Follow React hooks patterns for state management
- Use proper MSAL authentication patterns

## Microsoft Graph Permissions Required
- User.Read: Read signed-in user's profile
- Group.Read.All: Read all groups
- Directory.Read.All: Read directory data
- GroupMember.Read.All: Read group memberships

## Common Patterns
- All Graph API calls should go through the GraphService class
- Use proper loading states and error handling
- Follow the established component structure for new features
- Maintain consistent styling with Tailwind utility classes
