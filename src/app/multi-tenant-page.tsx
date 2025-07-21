'use client';

import { useState, useEffect } from 'react';
import { MultiTenantAuthService } from '../lib/multi-tenant-auth';
import { MultiTenantGraphService, GraphUser, TenantInfo } from '../lib/multi-tenant-graph-service';
import TreeVisualization from '../components/TreeVisualization';

export default function MultiTenantPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<GraphUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<GraphUser | null>(null);
  const [treeData, setTreeData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [currentUser, setCurrentUser] = useState<GraphUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const authService = MultiTenantAuthService.getInstance();
  const graphService = new MultiTenantGraphService();

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const isAuth = await authService.checkAuthStatus();
      setIsAuthenticated(isAuth);

      if (isAuth) {
        await loadTenantData();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setError('Authentication check failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTenantData = async () => {
    try {
      // Get tenant information
      const tenant = await graphService.getTenantInfo();
      setTenantInfo(tenant);

      // Get current user
      const user = await graphService.getCurrentUser();
      setCurrentUser(user);

      // Check if user is admin
      const adminStatus = await graphService.isUserAdmin();
      setIsAdmin(adminStatus);

      // Load users if admin
      if (adminStatus) {
        await loadUsers();
      } else if (user) {
        // If not admin, just show current user's groups
        setSelectedUser(user);
        await loadUserGroups(user.id);
      }
    } catch (error) {
      console.error('Failed to load tenant data:', error);
      setError('Failed to load tenant data. Please ensure you have the necessary permissions.');
    }
  };

  const loadUsers = async (search?: string) => {
    try {
      const userList = await graphService.getAllUsers(search);
      setUsers(userList);
      setError(null);
    } catch (error) {
      console.error('Failed to load users:', error);
      setError('Failed to load users. You may need additional permissions.');
    }
  };

  const loadUserGroups = async (userId: string) => {
    try {
      const tree = await graphService.buildGroupTree(userId);
      setTreeData(tree);
      setError(null);
    } catch (error) {
      console.error('Failed to load user groups:', error);
      setError('Failed to load group memberships.');
    }
  };

  const handleUserSelect = async (user: GraphUser) => {
    setSelectedUser(user);
    await loadUserGroups(user.id);
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (isAdmin) {
      await loadUsers(term);
    }
  };

  const handleLogin = () => {
    authService.login();
  };

  const handleLogout = () => {
    authService.logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🌍 Multi-Tenant Group Visualizer
            </h1>
            <p className="text-gray-600 mb-8">
              Sign in with your organizational account to view your tenant&apos;s group hierarchy
            </p>
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Sign in with Microsoft
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🌍 Multi-Tenant Group Visualizer
              </h1>
              {tenantInfo && (
                <p className="text-sm text-gray-600">
                  Tenant: {tenantInfo.displayName} ({tenantInfo.defaultDomain})
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {currentUser && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {currentUser.displayName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isAdmin ? '👑 Admin' : '👤 User'} • {authService.getTenantId()?.substring(0, 8)}...
                  </p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Search Panel (only for admins) */}
          {isAdmin && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  👥 Search Users
                </h2>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className={`w-full text-left p-3 rounded-md transition-colors ${
                        selectedUser?.id === user.id
                          ? 'bg-blue-50 border-2 border-blue-200'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="font-medium text-gray-900">
                        {user.displayName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.mail || user.userPrincipalName}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Visualization Panel */}
          <div className={isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                🌳 Group Hierarchy
                {selectedUser && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    for {selectedUser.displayName}
                  </span>
                )}
              </h2>
              
              {!isAdmin && currentUser && (
                <div className="mb-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    📋 Showing your group memberships. Contact your administrator for access to view other users.
                  </p>
                </div>
              )}

              {treeData ? (
                <div className="h-96">
                  <TreeVisualization 
                    data={treeData} 
                    onNodeSelect={(node) => console.log('Selected node:', node)}
                    selectedNode={undefined}
                    expandedNodes={expandedNodes}
                  />
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center text-gray-500">
                  {selectedUser ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p>Loading group memberships...</p>
                    </div>
                  ) : (
                    <p>
                      {isAdmin 
                        ? 'Select a user to view their group memberships'
                        : 'Loading your group memberships...'
                      }
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tenant Info Panel */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            🏢 Tenant Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tenant Name</label>
              <p className="mt-1 text-sm text-gray-900">{tenantInfo?.displayName || 'Loading...'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Primary Domain</label>
              <p className="mt-1 text-sm text-gray-900">{tenantInfo?.defaultDomain || 'Loading...'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Your Access Level</label>
              <p className="mt-1 text-sm text-gray-900">
                {isAdmin ? '👑 Administrator' : '👤 Standard User'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
