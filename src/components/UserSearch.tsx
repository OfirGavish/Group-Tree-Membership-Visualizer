'use client'

import { useState } from 'react'
import { User, UserSearchProps } from '@/types'

export default function UserSearch({ onUserSelect, users }: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userPrincipalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.mail && user.mail.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleUserSelect = (user: User) => {
    onUserSelect(user)
    setSearchTerm(user.displayName)
    setIsOpen(false)
  }

  return (
    <div className="relative w-96 mx-auto">
      <div className="relative group">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search for a user..."
          className="w-full px-6 py-4 pl-6 pr-14 text-base font-medium bg-gradient-to-r from-blue-500/20 via-cyan-500/15 to-blue-500/20 backdrop-blur-md border border-blue-300/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 text-white placeholder-blue-200/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-blue-500/25 hover:via-cyan-500/20 hover:to-blue-500/25"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-5">
          <svg
            className="w-6 h-6 text-blue-200/80 group-hover:text-blue-100 transition-colors duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {/* Floating gradient border animation */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </div>

      {isOpen && searchTerm && (
        <div className="absolute z-10 w-full mt-3 bg-gradient-to-br from-blue-500/15 via-cyan-500/10 to-blue-500/15 backdrop-blur-xl border border-blue-300/25 rounded-2xl shadow-2xl max-h-60 overflow-y-auto overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-cyan-600/10 animate-pulse"></div>
          
          <div className="relative">
            {filteredUsers.length > 0 ? (
              filteredUsers.slice(0, 10).map((user, index) => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="w-full px-5 py-4 text-left hover:bg-gradient-to-r hover:from-blue-500/25 hover:to-cyan-500/20 focus:bg-gradient-to-r focus:from-blue-500/25 focus:to-cyan-500/20 focus:outline-none border-b border-blue-300/15 last:border-b-0 transition-all duration-300 group relative overflow-hidden"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-cyan-400/10 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative">
                    <div className="font-medium text-white group-hover:text-blue-100 transition-colors duration-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></span>
                      {user.displayName}
                    </div>
                    <div className="text-sm text-blue-200/70 group-hover:text-blue-100/80 transition-colors duration-300 ml-4">{user.userPrincipalName}</div>
                    {user.jobTitle && (
                      <div className="text-xs text-blue-200/60 group-hover:text-blue-100/70 transition-colors duration-300 ml-4">{user.jobTitle}</div>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-5 py-4 text-blue-200/70 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-300/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                </svg>
                No users found
              </div>
            )}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
