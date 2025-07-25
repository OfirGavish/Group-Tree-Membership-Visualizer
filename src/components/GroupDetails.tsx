'use client'

import { Group, GroupMember, GroupDetailsProps } from '@/types'

export default function GroupDetails({ group, onMemberSelect }: GroupDetailsProps) {
  const isSecurityGroup = group.groupTypes.includes('Unified') ? false : true

  return (
    <div className="space-y-4">
      {/* Modern Header */}
      <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
          <h3 className="text-base font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Group Information
          </h3>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
              {group.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">👥</span>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-white text-base mb-2 truncate">
              {group.displayName}
            </h4>
            
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                isSecurityGroup 
                  ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-400/30 text-red-300'
                  : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/30 text-green-300'
              }`}>
                {isSecurityGroup ? 'Security' : 'M365'}
              </div>
              
              {group.members && (
                <div className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30">
                  <span className="text-blue-300 text-xs font-medium">
                    {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
            
            {group.description && (
              <p className="text-purple-200 text-xs leading-relaxed mb-2 line-clamp-2">{group.description}</p>
            )}
            
            {/* Group ID - Compact */}
            <div className="p-2 bg-black/20 rounded-lg border border-white/10">
              <div className="text-xs text-white/60 mb-1">Group ID</div>
              <div className="text-xs text-white/80 font-mono break-all line-clamp-2">
                {group.id}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Members Section - Compact */}
      {group.members && group.members.length > 0 && (
        <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse"></div>
            <h4 className="text-base font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Members ({group.members.length})
            </h4>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {group.members.slice(0, 10).map((member) => (
              <button
                key={member.id}
                onClick={() => onMemberSelect(member)}
                className="group w-full bg-gradient-to-br from-white/5 via-white/3 to-transparent backdrop-blur-lg border border-white/10 rounded-lg p-3 hover:border-white/30 hover:from-white/10 hover:shadow-lg transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-2">
                  <div className="relative flex-shrink-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md ${
                      member['@odata.type'].includes('user') 
                        ? 'bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600' 
                        : member['@odata.type'].includes('device')
                        ? 'bg-gradient-to-br from-green-500 via-emerald-500 to-green-600'
                        : 'bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600'
                    }`}>
                      {member.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">
                        {member['@odata.type'].includes('user') ? '👤' : 
                         member['@odata.type'].includes('device') ? '💻' : '👥'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white group-hover:text-blue-200 transition-colors truncate text-sm">
                      {member.displayName}
                    </div>
                    {member.userPrincipalName && (
                      <div className="text-xs text-white/70 group-hover:text-white/80 transition-colors truncate">
                        {member.userPrincipalName}
                      </div>
                    )}
                  </div>
                  
                  <svg className="w-3 h-3 text-white/40 group-hover:text-white/60 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
            {group.members.length > 10 && (
              <div className="text-center p-2 text-xs text-white/60">
                Showing 10 of {group.members.length} members
              </div>
            )}
          </div>
        </div>
      )}

      {/* Member Of Section - Compact */}
      {group.memberOf && group.memberOf.length > 0 && (
        <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-gradient-to-r from-orange-400 to-red-400 rounded-full animate-pulse"></div>
            <h4 className="text-base font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              Member of ({group.memberOf.length})
            </h4>
          </div>
          
          <div className="space-y-2">
            {group.memberOf.slice(0, 5).map((parentGroup) => (
              <div
                key={parentGroup.id}
                className="bg-gradient-to-br from-white/5 via-white/3 to-transparent backdrop-blur-lg border border-white/10 rounded-lg p-3 hover:border-white/20 transition-all duration-300"
              >
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-orange-500 via-red-500 to-orange-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md flex-shrink-0">
                    👥
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate text-sm">{parentGroup.displayName}</div>
                    {parentGroup.description && (
                      <div className="text-xs text-white/70 line-clamp-1">{parentGroup.description}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {group.memberOf.length > 5 && (
              <div className="text-center p-2 text-xs text-white/60">
                Showing 5 of {group.memberOf.length} parent groups
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State - Compact */}
      {(!group.members || group.members.length === 0) && (!group.memberOf || group.memberOf.length === 0) && (
        <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3 border border-purple-400/20">
            <span className="text-xl">👥</span>
          </div>
          <h4 className="text-sm font-semibold text-white mb-2">No Additional Details</h4>
          <p className="text-xs text-white/70">This group doesn&apos;t have any members or parent groups to display.</p>
        </div>
      )}
    </div>
  )
}
