'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '@/lib/msal-auth-service'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  userDisplayName: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await authService.initialize()
        const authenticated = await authService.isSignedIn()
        setIsAuthenticated(authenticated)

        if (authenticated) {
          const account = authService.getActiveAccount()
          setUserDisplayName(account?.name || account?.username || 'Unknown User')
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const signIn = async () => {
    try {
      setIsLoading(true)
      await authService.signIn()
      setIsAuthenticated(true)
      
      const account = authService.getActiveAccount()
      setUserDisplayName(account?.name || account?.username || 'Unknown User')
    } catch (error) {
      console.error('Sign in failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true)
      await authService.signOut()
      setIsAuthenticated(false)
      setUserDisplayName(null)
    } catch (error) {
      console.error('Sign out failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    userDisplayName,
    signIn,
    signOut
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}
