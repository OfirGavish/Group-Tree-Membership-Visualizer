'use client'

import React from 'react'
import { useAuth } from './AuthProvider'

export const LoginButton: React.FC = () => {
  const { isAuthenticated, isLoading, userDisplayName, signIn, signOut } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-700">
          Welcome, {userDisplayName}
        </span>
        <button
          onClick={signOut}
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
        >
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={signIn}
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
    >
      Sign In with Microsoft
    </button>
  )
}
