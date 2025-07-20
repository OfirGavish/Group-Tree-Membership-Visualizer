// Simplified authentication service for Azure Static Web Apps
export class StaticWebAppAuthService {
  private baseUrl = ''

  async getCurrentUser() {
    try {
      const response = await fetch('/.auth/me')
      const authInfo = await response.json()
      
      if (authInfo.clientPrincipal) {
        return {
          id: authInfo.clientPrincipal.userId,
          displayName: authInfo.clientPrincipal.userDetails,
          userPrincipalName: authInfo.clientPrincipal.userDetails,
          accessToken: authInfo.clientPrincipal.accessToken
        }
      }
      return null
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  async getAccessToken() {
    try {
      const response = await fetch('/.auth/me')
      const authInfo = await response.json()
      return authInfo.clientPrincipal?.accessToken || null
    } catch (error) {
      console.error('Error getting access token:', error)
      return null
    }
  }

  getLoginUrl() {
    return '/.auth/login/aad'
  }

  getLogoutUrl() {
    return '/.auth/logout'
  }
}
