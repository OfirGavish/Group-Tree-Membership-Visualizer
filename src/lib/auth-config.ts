// MSAL configuration for client-side authentication with delegated permissions
import { Configuration, PopupRequest, LogLevel } from '@azure/msal-browser';

// MSAL configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || '4c4814af-7b2a-4a96-bed9-59c394641f29',
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID || 'df5c1b3a-b49f-406f-b067-a4a6fae72629'}`,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : '',
    postLogoutRedirectUri: typeof window !== 'undefined' ? window.location.origin : '',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.log(message);
            return;
          default:
            console.log(message);
            return;
        }
      }
    }
  }
};

// Add scopes here for Microsoft Graph API
export const loginRequest: PopupRequest = {
  scopes: [
    'User.Read',
    'User.Read.All',
    'Group.Read.All',
    'Device.Read.All',
    'Directory.Read.All'
  ]
};

// Scopes for silent token acquisition
export const graphScopes = [
  'https://graph.microsoft.com/User.Read',
  'https://graph.microsoft.com/User.Read.All',
  'https://graph.microsoft.com/Group.Read.All',
  'https://graph.microsoft.com/Device.Read.All',
  'https://graph.microsoft.com/Directory.Read.All'
];
