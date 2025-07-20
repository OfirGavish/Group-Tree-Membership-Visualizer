import { Client } from '@microsoft/microsoft-graph-client';
import { MultiTenantAuthService } from './multi-tenant-auth';

export interface GraphUser {
  id: string;
  displayName: string;
  mail?: string;
  userPrincipalName: string;
}

export interface GraphGroup {
  id: string;
  displayName: string;
  description?: string;
  groupTypes: string[];
  memberOf?: GraphGroup[];
  members?: (GraphUser | GraphGroup)[];
}

export interface TenantInfo {
  id: string;
  displayName: string;
  defaultDomain: string;
}

export class MultiTenantGraphService {
  private client: Client | null = null;
  private authService: MultiTenantAuthService;

  constructor() {
    this.authService = MultiTenantAuthService.getInstance();
  }

  private async initializeClient(): Promise<Client> {
    if (this.client) {
      return this.client;
    }

    try {
      // Custom auth provider for Azure Static Web Apps
      const authProvider = {
        getAccessToken: async (): Promise<string> => {
          const token = await this.authService.getAccessToken();
          if (!token) {
            throw new Error('No access token available');
          }
          // If we get 'use-default-token', we'll let the browser handle auth
          if (token === 'use-default-token') {
            throw new Error('Token handling delegated to browser');
          }
          return token;
        }
      };

      this.client = Client.initWithMiddleware({ authProvider });
      return this.client;
    } catch (error) {
      console.error('Error initializing Graph client:', error);
      throw error;
    }
  }

  async getTenantInfo(): Promise<TenantInfo | null> {
    try {
      const client = await this.initializeClient();
      const organization = await client.api('/organization').get();
      
      if (organization.value && organization.value.length > 0) {
        const org = organization.value[0];
        return {
          id: org.id,
          displayName: org.displayName,
          defaultDomain: org.verifiedDomains?.find((d: any) => d.isDefault)?.name || 'Unknown'
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting tenant info:', error);
      return null;
    }
  }

  async getAllUsers(search?: string): Promise<GraphUser[]> {
    try {
      const client = await this.initializeClient();
      let query = client.api('/users').select('id,displayName,mail,userPrincipalName').top(100);
      
      if (search) {
        query = query.filter(`startswith(displayName,'${search}') or startswith(userPrincipalName,'${search}')`);
      }

      const response = await query.get();
      return response.value || [];
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<GraphUser | null> {
    try {
      const client = await this.initializeClient();
      const user = await client.api('/me').select('id,displayName,mail,userPrincipalName').get();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async getUserGroups(userId: string): Promise<GraphGroup[]> {
    try {
      const client = await this.initializeClient();
      const response = await client.api(`/users/${userId}/memberOf`).get();
      
      // Filter to only groups (not directory roles)
      const groups = response.value.filter((item: any) => item['@odata.type'] === '#microsoft.graph.group');
      
      return groups.map((group: any) => ({
        id: group.id,
        displayName: group.displayName,
        description: group.description,
        groupTypes: group.groupTypes || []
      }));
    } catch (error) {
      console.error('Error getting user groups:', error);
      throw error;
    }
  }

  async getGroupDetails(groupId: string): Promise<GraphGroup | null> {
    try {
      const client = await this.initializeClient();
      const group = await client.api(`/groups/${groupId}`).get();
      
      return {
        id: group.id,
        displayName: group.displayName,
        description: group.description,
        groupTypes: group.groupTypes || []
      };
    } catch (error) {
      console.error('Error getting group details:', error);
      return null;
    }
  }

  async getGroupMembers(groupId: string): Promise<(GraphUser | GraphGroup)[]> {
    try {
      const client = await this.initializeClient();
      const response = await client.api(`/groups/${groupId}/members`).get();
      
      return response.value.map((member: any) => {
        if (member['@odata.type'] === '#microsoft.graph.group') {
          return {
            id: member.id,
            displayName: member.displayName,
            description: member.description,
            groupTypes: member.groupTypes || []
          } as GraphGroup;
        } else {
          return {
            id: member.id,
            displayName: member.displayName,
            mail: member.mail,
            userPrincipalName: member.userPrincipalName
          } as GraphUser;
        }
      });
    } catch (error) {
      console.error('Error getting group members:', error);
      return [];
    }
  }

  async buildGroupTree(userId: string): Promise<any> {
    try {
      const groups = await this.getUserGroups(userId);
      
      if (groups.length === 0) {
        return null;
      }

      // Build a tree structure
      const root = {
        name: 'User Groups',
        children: groups.map(group => ({
          name: group.displayName,
          id: group.id,
          description: group.description,
          type: 'group',
          groupTypes: group.groupTypes
        }))
      };

      return root;
    } catch (error) {
      console.error('Error building group tree:', error);
      throw error;
    }
  }

  // Check if current user has admin permissions
  async isUserAdmin(): Promise<boolean> {
    try {
      const client = await this.initializeClient();
      const memberOf = await client.api('/me/memberOf').get();
      
      // Check for common admin roles
      const adminRoles = [
        'Global Administrator',
        'Privileged Role Administrator',
        'User Administrator',
        'Groups Administrator'
      ];

      return memberOf.value.some((role: any) => 
        role['@odata.type'] === '#microsoft.graph.directoryRole' &&
        adminRoles.some(adminRole => role.displayName?.includes(adminRole))
      );
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }
}
