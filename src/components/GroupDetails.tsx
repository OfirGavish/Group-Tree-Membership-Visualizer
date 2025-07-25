'use client'

import { Group, GroupMember, GroupDetailsProps } from '@/types'

export default function GroupDetails({ group, onMemberSelect }: GroupDetailsProps) {
  const isSecurityGroup = group.groupTypes.includes('Unified') ? false : true

  return (
    <div className="space-y-4 w-full">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-br from-white/15 via-white/8 to-white/5 backdrop-blur-xl rounded-2xl p-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
          <h3 className="text-base font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent">
            Group Information
          </h3>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {group.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-md">
              <span className="text-xs">👥</span>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-white text-base mb-2 truncate">
              {group.displayName}
            </h4>
            
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold backdrop-blur-sm ${
                isSecurityGroup 
                  ? 'bg-gradient-to-r from-red-500/30 to-red-400/20 text-red-200'
                  : 'bg-gradient-to-r from-green-500/30 to-green-400/20 text-green-200'
              }`}>
                {isSecurityGroup ? '🔒 Security' : '🏢 M365'}
              </div>
              
              {group.members && (
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/30 to-cyan-400/20 backdrop-blur-sm">
                  <span className="text-blue-200 text-sm font-semibold">
                    👤 {group.members.length} members
                  </span>
                </div>
              )}
            </div>
            
            {group.description && (
              <p className="text-purple-200/80 text-sm leading-relaxed italic bg-black/20 px-3 py-2 rounded-lg">{group.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Members Section */}
      {group.members && group.members.length > 0 && (
        <div className="bg-gradient-to-br from-white/15 via-white/8 to-white/5 backdrop-blur-xl rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse"></div>
            <h4 className="text-base font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 bg-clip-text text-transparent">
              Group Members ({group.members.length})
            </h4>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {group.members.slice(0, 5).map((member) => (
              <button
                key={member.id}
                onClick={() => onMemberSelect(member)}
                className="group-member-btn group w-full bg-gradient-to-r from-white/5 via-white/8 to-white/5 hover:from-white/15 hover:via-white/20 hover:to-white/15 rounded-xl p-3 hover:scale-[1.02] transition-all duration-200 text-left shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-sm font-bold shadow-md ${
                    member['@odata.type'].includes('user') 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
                      : member['@odata.type'].includes('device')
                      ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                      : 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'
                  }`}>
                    {member['@odata.type'].includes('user') ? '👤' : 
                     member['@odata.type'].includes('device') ? '💻' : '👥'}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm truncate">
                      {member.displayName}
                    </div>
                    <div className="text-white/60 text-xs">
                      {member['@odata.type'].includes('user') ? 'User Account' : 
                       member['@odata.type'].includes('device') ? 'Device' : 'Group'}
                    </div>
                  </div>
                  
                  <svg className="w-4 h-4 text-white/50 flex-shrink-0 group-hover:text-white/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '16px', height: '16px', minWidth: '16px', minHeight: '16px', maxWidth: '16px', maxHeight: '16px'}}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
            {group.members.length > 5 && (
              <div className="text-center py-2">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full backdrop-blur-sm">
                  <span className="text-purple-200 text-sm font-medium">+{group.members.length - 5} more members</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Parent Groups Section */}
      {group.memberOf && group.memberOf.length > 0 && (
        <div className="bg-gradient-to-br from-white/15 via-white/8 to-white/5 backdrop-blur-xl rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 bg-gradient-to-r from-orange-400 to-red-400 rounded-full animate-pulse"></div>
            <h4 className="text-base font-bold bg-gradient-to-r from-orange-400 via-red-400 to-orange-500 bg-clip-text text-transparent">
              Parent Groups ({group.memberOf.length})
            </h4>
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {group.memberOf.slice(0, 3).map((parentGroup) => (
              <div
                key={parentGroup.id}
                className="bg-gradient-to-r from-white/8 via-white/12 to-white/8 rounded-xl p-3 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-sm shadow-md">
                    👥
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate text-sm">{parentGroup.displayName}</div>
                    <div className="text-orange-200/80 text-xs">Parent Group</div>
                  </div>
                </div>
              </div>
            ))}
            {group.memberOf.length > 3 && (
              <div className="text-center py-2">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full backdrop-blur-sm">
                  <span className="text-orange-200 text-sm font-medium">+{group.memberOf.length - 3} more parent groups</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Empty State */}
      {(!group.members || group.members.length === 0) && (!group.memberOf || group.memberOf.length === 0) && (
        <div className="bg-gradient-to-br from-white/15 via-white/8 to-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500/30 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👥</span>
          </div>
          <h4 className="text-lg font-bold text-white mb-2">No Group Details</h4>
          <p className="text-sm text-white/70 leading-relaxed">This group has no members or parent groups to display.</p>
        </div>
      )}
    </div>
  )
}
