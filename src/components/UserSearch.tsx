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
    <div className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search for a user..."
          className="w-full px-4 py-3 text-sm bg-white/20 backdrop-blur-md border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-white placeholder-white/70"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <svg
            className="w-4 h-4 text-white/70"
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
      </div>

      {isOpen && searchTerm && (
        <div className="absolute z-10 w-full mt-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {filteredUsers.length > 0 ? (
            filteredUsers.slice(0, 10).map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className="w-full px-4 py-3 text-left hover:bg-white/20 focus:bg-white/20 focus:outline-none border-b border-white/10 last:border-b-0 transition-colors"
              >
                <div className="font-medium text-white">{user.displayName}</div>
                <div className="text-sm text-white/70">{user.userPrincipalName}</div>
                {user.jobTitle && (
                  <div className="text-xs text-white/60">{user.jobTitle}</div>
                )}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-white/70 text-sm">No users found</div>
          )}
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
