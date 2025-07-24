// Client-side authentication service using MSAL.js for true delegated permissions
import { PublicClientApplication, AccountInfo, SilentRequest, AuthenticationResult } from '@azure/msal-browser';
import { msalConfig, loginRequest, graphScopes } from './auth-config';

class MsalAuthService {
  private msalInstance: PublicClientApplication;
  private initialized = false;

  constructor() {
    this.msalInstance = new PublicClientApplication(msalConfig);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.msalInstance.initialize();
      this.initialized = true;
      console.log('MSAL initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MSAL:', error);
      throw error;
    }
  }

  async signIn(): Promise<AccountInfo | null> {
    await this.initialize();

    try {
      const response = await this.msalInstance.loginPopup(loginRequest);
      console.log('Sign-in successful:', response.account?.username);
      return response.account;
    } catch (error) {
      console.error('Sign-in failed:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    await this.initialize();

    try {
      await this.msalInstance.logoutPopup();
      console.log('Sign-out successful');
    } catch (error) {
      console.error('Sign-out failed:', error);
      throw error;
    }
  }

  async getAccount(): Promise<AccountInfo | null> {
    await this.initialize();

    const accounts = this.msalInstance.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  }

  async getAccessToken(): Promise<string | null> {
    await this.initialize();

    const account = await this.getAccount();
    if (!account) {
      console.log('No account found, user needs to sign in');
      return null;
    }

    const silentRequest: SilentRequest = {
      scopes: graphScopes,
      account: account
    };

    try {
      const response: AuthenticationResult = await this.msalInstance.acquireTokenSilent(silentRequest);
      console.log('Access token acquired silently');
      return response.accessToken;
    } catch (error) {
      console.warn('Silent token acquisition failed, trying interactive:', error);

      try {
        const response = await this.msalInstance.acquireTokenPopup({
          scopes: graphScopes,
          account: account
        });
        console.log('Access token acquired interactively');
        return response.accessToken;
      } catch (interactiveError) {
        console.error('Interactive token acquisition failed:', interactiveError);
        throw interactiveError;
      }
    }
  }

  async isAuthenticated(): Promise<boolean> {
    await this.initialize();
    const account = await this.getAccount();
    return account !== null;
  }

  async getUserInfo(): Promise<AccountInfo | null> {
    return await this.getAccount();
  }

  async isSignedIn(): Promise<boolean> {
    return await this.isAuthenticated();
  }

  getActiveAccount(): AccountInfo | null {
    if (!this.initialized) return null;
    const accounts = this.msalInstance.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  }

  /**
   * Get current user info (compatibility method)
   */
  async getCurrentUser() {
    try {
      const account = await this.getAccount();
      if (!account) {
        return null;
      }

      // Return user info from the account
      return {
        userPrincipalName: account.username,
        displayName: account.name || account.username,
        givenName: account.idTokenClaims?.given_name || '',
        surname: account.idTokenClaims?.family_name || '',
        id: account.localAccountId,
        mail: account.username
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Get login URL (for MSAL this is handled by redirect/popup)
   */
  getLoginUrl(): string {
    // For MSAL, we don't use URLs but this method is for compatibility
    return '#';
  }

  /**
   * Get logout URL (for MSAL this is handled by redirect/popup)
   */
  getLogoutUrl(): string {
    // For MSAL, we don't use URLs but this method is for compatibility  
    return '#';
  }
}

// Create a singleton instance
export const authService = new MsalAuthService();
