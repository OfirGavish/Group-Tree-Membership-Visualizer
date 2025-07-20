# 🚀 Quick Start - Deploy to Azure

Your Group Tree Membership Visualizer is ready to deploy! 

## ✅ What's Ready:
- ✅ Built and tested locally
- ✅ Configured for Azure Static Web Apps
- ✅ Built-in authentication ready
- ✅ Static export generated in `/out` folder

## 🚀 Deploy Now (5 minutes):

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: Group Tree Membership Visualizer"
git remote add origin https://github.com/YOUR_USERNAME/your-repo-name.git
git push -u origin main
```

### 2. Create Azure Static Web App
1. Go to [Azure Portal](https://portal.azure.com)
2. Create Resource → Static Web App
3. Connect to your GitHub repository
4. Build preset: **Next.js**
5. Output location: **out**
6. Deploy!

### 3. Enable Authentication
1. Go to your Static Web App → Authentication
2. Add identity provider → Microsoft
3. Create new app registration
4. Done! 🎉

### 4. Add Microsoft Graph Permissions
1. Azure AD → App registrations → Your app
2. API permissions → Add permission → Microsoft Graph
3. Add: `Group.Read.All`, `Directory.Read.All`, `GroupMember.Read.All`
4. Grant admin consent

## 📖 Detailed Guide
See `DEPLOYMENT_GUIDE.md` for complete step-by-step instructions.

## 🔧 Local Development
```bash
npm run dev    # Start development server
npm run build  # Build for production
```

---
**No custom app registration needed!** Azure Static Web Apps handles everything automatically. 🚀
