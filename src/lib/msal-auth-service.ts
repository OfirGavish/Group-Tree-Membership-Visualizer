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
      console.log('[MSAL] Initialized successfully');
      
      // Handle redirect response if any
      const response = await this.msalInstance.handleRedirectPromise();
      if (response) {
        console.log('[MSAL] Redirect response received:', response.account?.username);
      }
    } catch (error) {
      console.error('[MSAL] Failed to initialize:', error);
      throw error;
    }
  }

  async signIn(): Promise<AccountInfo | null> {
    await this.initialize();

    try {
      console.log('[MSAL] Starting sign-in process...');
      const response = await this.msalInstance.loginPopup(loginRequest);
      console.log('[MSAL] Sign-in successful:', response.account?.username);
      return response.account;
    } catch (error) {
      console.error('[MSAL] Sign-in failed:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    await this.initialize();

    try {
      const account = this.msalInstance.getActiveAccount() || this.msalInstance.getAllAccounts()[0];
      if (account) {
        await this.msalInstance.logoutPopup({
          account: account,
          postLogoutRedirectUri: msalConfig.auth.postLogoutRedirectUri
        });
      }
      console.log('[MSAL] Sign-out successful');
    } catch (error) {
      console.error('[MSAL] Sign-out failed:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<AccountInfo | null> {
    await this.initialize();
    
    const account = this.msalInstance.getActiveAccount();
    if (account) {
      return account;
    }

    // If no active account, check if we have any accounts
    const accounts = this.msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      this.msalInstance.setActiveAccount(accounts[0]);
      return accounts[0];
    }

    return null;
  }

  async getAccessToken(): Promise<string> {
    await this.initialize();

    const account = await this.getCurrentUser();
    if (!account) {
      throw new Error('No account found. Please sign in.');
    }

    try {
      // Try silent token acquisition first
      const silentRequest: SilentRequest = {
        scopes: graphScopes,
        account: account,
      };

      const response = await this.msalInstance.acquireTokenSilent(silentRequest);
      console.log('[MSAL] Token acquired silently');
      return response.accessToken;
    } catch (error) {
      console.warn('[MSAL] Silent token acquisition failed, trying interactive:', error);

      try {
        // Fall back to interactive token acquisition
        const response = await this.msalInstance.acquireTokenPopup({
          scopes: graphScopes,
          account: account,
        });
        console.log('[MSAL] Token acquired interactively');
        return response.accessToken;
      } catch (interactiveError) {
        console.error('[MSAL] Interactive token acquisition failed:', interactiveError);
        throw new Error('Failed to acquire access token. Please sign in again.');
      }
    }
  }

  async isSignedIn(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user !== null;
    } catch {
      return false;
    }
  }

  // Legacy compatibility methods
  async getAccount(): Promise<AccountInfo | null> {
    return await this.getCurrentUser();
  }

  async isAuthenticated(): Promise<boolean> {
    return await this.isSignedIn();
  }

  async getUserInfo(): Promise<AccountInfo | null> {
    return await this.getCurrentUser();
  }

  getActiveAccount(): AccountInfo | null {
    if (!this.initialized) return null;
    const accounts = this.msalInstance.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  }

  getLoginUrl(): string {
    return '#';
  }

  getLogoutUrl(): string {
    return '#';
  }
}

// Export singleton instance
export const authService = new MsalAuthService();
