'use client'

import { Group, GroupMember, GroupDetailsProps } from '@/types'

export default function GroupDetails({ group, onMemberSelect }: GroupDetailsProps) {
  const isSecurityGroup = group.groupTypes.includes('Unified') ? false : true

  return (
    <div className="space-y-3 w-full">
      {/* Compact Header */}
      <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl border border-white/20 rounded-xl p-3 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
          <h3 className="text-sm font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Group Info
          </h3>
        </div>
        
        <div className="flex items-start gap-2">
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md">
              {group.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs">👥</span>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white text-sm mb-1 truncate">
              {group.displayName}
            </h4>
            
            <div className="flex flex-wrap items-center gap-1 mb-1">
              <div className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                isSecurityGroup 
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-green-500/20 text-green-300'
              }`}>
                {isSecurityGroup ? 'Sec' : 'M365'}
              </div>
              
              {group.members && (
                <div className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-blue-500/20">
                  <span className="text-blue-300 text-xs">
                    {group.members.length} mbr
                  </span>
                </div>
              )}
            </div>
            
            {group.description && (
              <p className="text-purple-200 text-xs leading-tight mb-1 line-clamp-1">{group.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Ultra Compact Members */}
      {group.members && group.members.length > 0 && (
        <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl border border-white/20 rounded-xl p-2 shadow-xl">
          <div className="flex items-center gap-1 mb-2">
            <div className="w-1.5 h-1.5 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"></div>
            <h4 className="text-sm font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Members ({group.members.length})
            </h4>
          </div>
          
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {group.members.slice(0, 5).map((member) => (
              <button
                key={member.id}
                onClick={() => onMemberSelect(member)}
                className="group-member-btn group w-full bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-md p-1 hover:border-white/30 transition-all text-left text-xs"
              >
                <div className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded flex items-center justify-center text-xs font-bold ${
                    member['@odata.type'].includes('user') 
                      ? 'bg-blue-500' 
                      : member['@odata.type'].includes('device')
                      ? 'bg-green-500'
                      : 'bg-purple-500'
                  }`}>
                    {member['@odata.type'].includes('user') ? '👤' : 
                     member['@odata.type'].includes('device') ? '💻' : '👥'}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-xs truncate">
                      {member.displayName}
                    </div>
                  </div>
                  
                  <svg className="w-2 h-2 text-white/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
            {group.members.length > 5 && (
              <div className="text-center text-xs text-white/60">
                +{group.members.length - 5} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ultra Compact Parent Groups */}
      {group.memberOf && group.memberOf.length > 0 && (
        <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl border border-white/20 rounded-xl p-2 shadow-xl">
          <div className="flex items-center gap-1 mb-2">
            <div className="w-1.5 h-1.5 bg-gradient-to-r from-orange-400 to-red-400 rounded-full"></div>
            <h4 className="text-sm font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              Parent ({group.memberOf.length})
            </h4>
          </div>
          
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {group.memberOf.slice(0, 3).map((parentGroup) => (
              <div
                key={parentGroup.id}
                className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-md p-1.5"
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 bg-orange-500 rounded flex items-center justify-center text-xs">
                    👥
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate text-xs">{parentGroup.displayName}</div>
                  </div>
                </div>
              </div>
            ))}
            {group.memberOf.length > 3 && (
              <div className="text-center text-xs text-white/60">
                +{group.memberOf.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!group.members || group.members.length === 0) && (!group.memberOf || group.memberOf.length === 0) && (
        <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl border border-white/20 rounded-xl p-3 shadow-xl text-center">
          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
            <span className="text-sm">👥</span>
          </div>
          <h4 className="text-xs font-semibold text-white mb-1">No Details</h4>
          <p className="text-xs text-white/70">No members or parents to show.</p>
        </div>
      )}
    </div>
  )
}
