# Group Tree Membership Visualizer

A modern web application for visualizing Entra ID (Azure AD) group memberships and hierarchies with interactive tree diagrams.

## 🌟 Features

- **Interactive Tree Visualization**: Navigate group hierarchies with D3.js-powered tree diagrams
- **User Search**: Find users quickly with intelligent search and autocomplete
- **Drill-Down Navigation**: Click on groups to explore members and nested group relationships
- **Drill-Up Navigation**: See parent groups and understand the broader organizational structure
- **Real-Time Data**: Direct integration with Microsoft Graph API for up-to-date information
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Secure Authentication**: Microsoft MSAL integration for enterprise security

## 🏗️ Architecture

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Authentication**: Microsoft MSAL (Microsoft Authentication Library)
- **Data Source**: Microsoft Graph API
- **Visualization**: D3.js for interactive tree diagrams
- **Hosting**: Ready for Azure App Service or Azure Static Web Apps

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or later
- An Azure App Registration with appropriate permissions
- Access to an Entra ID tenant

### 1. Clone and Install

```bash
# Install dependencies
npm install
```

### 2. Azure App Registration Setup

1. Go to [Azure Portal](https://portal.azure.com) → Azure Active Directory → App registrations
2. Create a new app registration:
   - **Name**: Group Tree Membership Visualizer
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: Web → `http://localhost:3000`

3. Configure API Permissions:
   - Microsoft Graph (Delegated permissions):
     - `User.Read`
     - `Group.Read.All`
     - `Directory.Read.All`
     - `GroupMember.Read.All`
   - Grant admin consent for your organization

4. Note down the **Application (client) ID** and **Directory (tenant) ID**

### 3. Environment Configuration

1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your Azure App Registration details:
   ```env
   NEXT_PUBLIC_MSAL_CLIENT_ID=your-client-id-here
   NEXT_PUBLIC_MSAL_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
   NEXT_PUBLIC_MSAL_REDIRECT_URI=http://localhost:3000
   ```

### 4. Run the Application

```bash
# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📱 Usage

1. **Sign In**: Click "Sign in with Microsoft" to authenticate with your Entra ID account
2. **Search Users**: Use the search box to find users in your organization
3. **Explore Groups**: Select a user to see their group memberships in a visual tree
4. **Navigate**: Click on groups to see their members and parent groups
5. **Drill Down/Up**: Explore nested group relationships and organizational hierarchies

## 🔧 Development

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── GroupDetails.tsx   # Group information panel
│   ├── TreeVisualization.tsx # D3.js tree diagram
│   └── UserSearch.tsx     # User search interface
├── lib/                   # Utilities and services
│   ├── auth-config.ts     # MSAL configuration
│   └── graph-service.ts   # Microsoft Graph API client
└── types/                 # TypeScript definitions
    └── index.ts           # Application types
```

### Key Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Adding New Features

1. **New Components**: Add to `src/components/` with proper TypeScript types
2. **Graph API Calls**: Extend `GraphService` class in `src/lib/graph-service.ts`
3. **Types**: Define new interfaces in `src/types/index.ts`
4. **Styling**: Use Tailwind CSS utility classes

## 🚀 Deployment

### Azure Static Web Apps (Recommended)

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to Azure Static Web Apps using Azure CLI or GitHub Actions

3. Configure environment variables in Azure portal

### Azure App Service

1. Configure build settings for Node.js application
2. Set environment variables in Application Settings
3. Deploy using Azure CLI, VS Code, or GitHub Actions

## 🔒 Security Considerations

- **Authentication**: Uses Microsoft MSAL for secure OAuth flows
- **Permissions**: Requests minimal required permissions
- **Token Management**: Automatic token refresh and secure storage
- **API Calls**: All Graph API calls are made server-side or with proper CORS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -am 'Add new feature'`
5. Push to the branch: `git push origin feature/new-feature`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**Authentication Error**: "AADSTS65001: The user or administrator has not consented to use the application"
- Solution: Grant admin consent for the required permissions in Azure portal

**API Permission Error**: "Insufficient privileges to complete the operation"
- Solution: Ensure all required Graph API permissions are granted and consented

**Build Error**: TypeScript compilation issues
- Solution: Run `npm run lint` to identify and fix type issues

**Environment Variables**: Application not connecting to Azure
- Solution: Verify `.env.local` file has correct values and restart the development server

### Getting Help

- Check the [Issues](https://github.com/your-repo/group-tree-visualizer/issues) page
- Review Microsoft Graph API documentation
- Check Azure App Registration configuration

## 🙏 Acknowledgments

- Microsoft Graph API for providing access to Entra ID data
- D3.js community for powerful visualization capabilities
- Next.js team for the excellent React framework
- Tailwind CSS for the utility-first CSS framework
