// Multi-tenant authentication service for Azure Static Web Apps
export interface UserInfo {
  userId: string;
  userDetails: string;
  userRoles: string[];
  claims: Record<string, any>;
  tenantId?: string;
  name?: string;
  email?: string;
}

export class MultiTenantAuthService {
  private static instance: MultiTenantAuthService;
  private currentUser: UserInfo | null = null;

  static getInstance(): MultiTenantAuthService {
    if (!MultiTenantAuthService.instance) {
      MultiTenantAuthService.instance = new MultiTenantAuthService();
    }
    return MultiTenantAuthService.instance;
  }

  async getCurrentUser(): Promise<UserInfo | null> {
    try {
      const response = await fetch('/.auth/me');
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (!data.clientPrincipal) {
        return null;
      }

      const user = data.clientPrincipal;
      
      // Extract tenant ID from claims
      const tenantId = user.claims?.find((claim: any) => 
        claim.typ === 'http://schemas.microsoft.com/identity/claims/tenantid'
      )?.val;

      // Extract user details
      const name = user.claims?.find((claim: any) => 
        claim.typ === 'name' || claim.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
      )?.val;

      const email = user.claims?.find((claim: any) => 
        claim.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
      )?.val;

      this.currentUser = {
        userId: user.userId,
        userDetails: user.userDetails,
        userRoles: user.userRoles || [],
        claims: user.claims || [],
        tenantId,
        name,
        email
      };

      return this.currentUser;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      // For Azure Static Web Apps with AAD, the token is automatically available
      // We'll use the Microsoft Graph client with the built-in token
      const response = await fetch('/.auth/me');
      if (!response.ok) {
        throw new Error('Not authenticated');
      }

      const data = await response.json();
      if (!data.clientPrincipal) {
        throw new Error('No client principal found');
      }

      // In Azure Static Web Apps, you typically need to make a call to get the access token
      // This varies by implementation - some use /.auth/token, others use different endpoints
      const tokenResponse = await fetch('/.auth/token/aad', {
        headers: {
          'X-ZUMO-AUTH': data.clientPrincipal.userId
        }
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        return tokenData.access_token;
      }

      // Fallback: If direct token endpoint doesn't work, 
      // we'll rely on the Graph client's ability to handle auth
      return 'use-default-token';
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  getTenantId(): string | null {
    return this.currentUser?.tenantId || null;
  }

  getUserName(): string | null {
    return this.currentUser?.name || this.currentUser?.userDetails || null;
  }

  getUserEmail(): string | null {
    return this.currentUser?.email || null;
  }

  getLoginUrl(): string {
    return '/.auth/login/aad';
  }

  getLogoutUrl(): string {
    return '/.auth/logout';
  }

  async checkAuthStatus(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  async login(): Promise<void> {
    window.location.href = this.getLoginUrl();
  }

  async logout(): Promise<void> {
    window.location.href = this.getLogoutUrl();
  }
}
