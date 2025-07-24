// MSAL configuration for client-side authentication with delegated permissions
import { Configuration, PopupRequest, LogLevel } from '@azure/msal-browser';

// MSAL configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: '4c4814af-7b2a-4a96-bed9-59c394641f29',
    authority: 'https://login.microsoftonline.com/df5c1b3a-b49f-406f-b067-a4a6fae72629',
    redirectUri: typeof window !== 'undefined' ? window.location.origin : 'https://red-sky-0da39dc03.1.azurestaticapps.net',
    postLogoutRedirectUri: typeof window !== 'undefined' ? window.location.origin : 'https://red-sky-0da39dc03.1.azurestaticapps.net',
  },
  cache: {
    cacheLocation: 'localStorage', // Use localStorage instead of sessionStorage for persistence
    storeAuthStateInCookie: false,
  },
  system: {
    allowNativeBroker: false, // Disable native broker for web apps
    loggerOptions: {
      loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error('[MSAL]', message);
            return;
          case LogLevel.Warning:
            console.warn('[MSAL]', message);
            return;
          case LogLevel.Info:
            console.info('[MSAL]', message);
            return;
          case LogLevel.Verbose:
            console.log('[MSAL]', message);
            return;
          default:
            console.log('[MSAL]', message);
            return;
        }
      },
      logLevel: LogLevel.Info
    }
  }
};

// Basic login request
export const loginRequest: PopupRequest = {
  scopes: ['openid', 'profile', 'User.Read'],
  prompt: 'select_account'
};

// Scopes for Graph API calls
export const graphScopes = [
  'User.Read.All',
  'Group.Read.All', 
  'Device.Read.All',
  'Directory.Read.All'
];
