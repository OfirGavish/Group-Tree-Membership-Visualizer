# Group Tree Membership Visualizer

A modern web application for visualizing Entra ID (Azure AD) group memberships and hierarchies with interactive tree diagrams.

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FOfirGavish%2FGroup-Tree-Membership-Visualizer%2Fmain%2Fazuredeploy.json)

## 🌟 Features

- **Interactive Tree Visualization**: Navigate group hierarchies with D3.js-powered tree diagrams
- **User Search**: Find users quickly with intelligent search and autocomplete
- **Drill-Down Navigation**: Click on groups to explore members and nested group relationships
- **Drill-Up Navigation**: See parent groups and understand the broader organizational structure
- **Real-Time Data**: Direct integration with Microsoft Graph API for up-to-date information
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Secure Authentication**: Azure Static Web Apps built-in authentication (no custom app registration needed!)

## 🏗️ Architecture

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Authentication**: Azure Static Web Apps built-in authentication
- **Data Source**: Microsoft Graph API
- **Visualization**: D3.js for interactive tree diagrams
- **Hosting**: Azure Static Web Apps (optimized for this platform)

## 🚀 Quick Start Options

### Option 1: One-Click Deploy to Azure (Recommended)

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FOfirGavish%2FGroup-Tree-Membership-Visualizer%2Fmain%2Fazuredeploy.json)

Click the button above to deploy directly to your Azure subscription. This will:
- ✅ Create an Azure Static Web App
- ✅ Set up GitHub Actions for continuous deployment
- ✅ Configure authentication automatically
- ✅ Handle all Microsoft Graph permissions

**No manual app registration required!**

### Option 2: No GitHub Account? No Problem!

**For administrators without GitHub accounts:**

📋 **Azure CLI Deployment**:
```bash
# Download and run our deployment script
curl -L -o deploy.sh https://raw.githubusercontent.com/OfirGavish/Group-Tree-Membership-Visualizer/main/deploy-azure-cli.sh
chmod +x deploy.sh
./deploy.sh
```

💻 **PowerShell Deployment**:
```powershell
# Download and run PowerShell script
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/OfirGavish/Group-Tree-Membership-Visualizer/main/deploy-azure-powershell.ps1" -OutFile "deploy.ps1"
.\deploy.ps1
```

📖 **See [DEPLOYMENT_ALTERNATIVES.md](./DEPLOYMENT_ALTERNATIVES.md) for more options:**
- Azure Portal upload
- Pre-built release packages
- Container deployment
- Enterprise deployment guides

### Option 3: Manual Setup
- ✅ Set up GitHub Actions for continuous deployment
- ✅ Configure authentication automatically
- ✅ Handle all Microsoft Graph permissions

**No manual app registration required!**

### Option 3: Manual Setup

#### Prerequisites

- Node.js 18 or later
- Azure subscription
- GitHub account (for deployment)

#### 1. Clone and Install

```bash
git clone https://github.com/OfirGavish/Group-Tree-Membership-Visualizer.git
cd Group-Tree-Membership-Visualizer
npm install
```

#### 2. Local Development

```bash
# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

**Note**: Authentication will only work after deployment to Azure Static Web Apps.

#### 3. Deploy to Azure Static Web Apps

Follow the detailed guide in [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for step-by-step instructions.
## 📱 Usage

1. **Deploy to Azure**: Use the "Deploy to Azure" button above or follow manual deployment steps
2. **Sign In**: Click "Sign in with Microsoft" to authenticate with your Entra ID account
3. **Search Users**: Use the search box to find users in your organization
4. **Explore Groups**: Select a user to see their group memberships in a visual tree
5. **Navigate**: Click on groups to see their members and parent groups
6. **Drill Down/Up**: Explore nested group relationships and organizational hierarchies

## 🏢 Deployment Options

### Single-Tenant (Recommended for most organizations)
- ✅ Deploy once per organization
- ✅ Maximum security and data isolation
- ✅ Easier compliance and governance
- ✅ Use the "Deploy to Azure" button above

### Multi-Tenant (For SaaS scenarios)
- 🌍 One deployment serves multiple organizations
- 🔧 More complex setup and maintenance
- 📋 Requires publisher verification for production
- 📖 Follow [MULTI_TENANT_SETUP.md](./MULTI_TENANT_SETUP.md) guide

## 🔧 Development

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page (single-tenant)
│   └── simple-page.tsx    # Simplified authentication version
│   └── multi-tenant-page.tsx # Multi-tenant version
├── components/            # React components
│   ├── GroupDetails.tsx   # Group information panel
│   ├── TreeVisualization.tsx # D3.js tree diagram
│   └── UserSearch.tsx     # User search interface
├── lib/                   # Utilities and services
│   ├── static-web-app-auth.ts    # Azure Static Web Apps authentication
│   ├── simple-graph-service.ts  # Microsoft Graph API client
│   ├── multi-tenant-auth.ts     # Multi-tenant authentication
│   └── multi-tenant-graph-service.ts # Multi-tenant Graph client
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
2. **Graph API Calls**: Extend `SimpleGraphService` or `MultiTenantGraphService` classes
3. **Types**: Define new interfaces in `src/types/index.ts`
4. **Styling**: Use Tailwind CSS utility classes

## 🚀 Deployment

### Azure Static Web Apps (Recommended)

**Option 1: One-Click Deploy**
- Click the "Deploy to Azure" button at the top of this README
- Follow the Azure portal wizard
- Automatic configuration and deployment

**Option 2: Manual Deployment**
- Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed steps
- Build: `npm run build`
- Deploy via GitHub Actions (automatically configured)

### Environment Variables

**No environment variables needed!** Azure Static Web Apps handles authentication automatically.

## 🔒 Security & Permissions

### Automatic Configuration
Azure Static Web Apps automatically:
- ✅ Creates app registration
- ✅ Configures Microsoft Graph permissions
- ✅ Handles OAuth flows
- ✅ Manages token refresh

### Required Microsoft Graph Permissions
The app requests these delegated permissions:
- `User.Read` - Read signed-in user's profile
- `Group.Read.All` - Read all groups
- `Directory.Read.All` - Read directory data
- `GroupMember.Read.All` - Read group memberships

**Admin consent is automatically handled during deployment.**

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

**Authentication Error**: "Need admin approval" or "AADSTS65001"
- Solution: Admin consent is required - this happens automatically during Azure deployment

**API Permission Error**: "Insufficient privileges to complete the operation"
- Solution: Ensure admin consent was granted during deployment, check Azure portal

**Build Error**: TypeScript compilation issues
- Solution: Run `npm run lint` to identify and fix type issues

**Deployment Issues**: Static Web App not working
- Solution: Check GitHub Actions logs, ensure repository is connected properly

### Getting Help

- Check the [Issues](https://github.com/OfirGavish/Group-Tree-Membership-Visualizer/issues) page
- Review [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed setup steps
- Check [MULTI_TENANT_SETUP.md](./MULTI_TENANT_SETUP.md) for multi-tenant scenarios
- Review Microsoft Graph API documentation

## 🙏 Acknowledgments

- Microsoft Graph API for providing access to Entra ID data
- D3.js community for powerful visualization capabilities
- Next.js team for the excellent React framework
- Tailwind CSS for the utility-first CSS framework
