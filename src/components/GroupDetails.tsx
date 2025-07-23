'use client'

import { Group, GroupMember, GroupDetailsProps } from '@/types'

export default function GroupDetails({ group, onMemberSelect }: GroupDetailsProps) {
  const isSecurityGroup = group.groupTypes.includes('Unified') ? false : true

  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/30 to-purple-500/30 backdrop-blur-md text-white p-6">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-2xl">
            👥
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1 text-white">{group.displayName}</h3>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                isSecurityGroup 
                  ? 'bg-red-500/20 text-red-100 border border-red-400/30' 
                  : 'bg-green-500/20 text-green-100 border border-green-400/30'
              }`}>
                {isSecurityGroup ? 'Security Group' : 'Microsoft 365 Group'}
              </span>
            </div>
            {group.description && (
              <p className="text-white/80 text-sm mt-2 leading-relaxed">{group.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Group Information */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-sm">
          <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
            Group Information
          </h4>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-white/70 font-medium">Group ID:</span>
              <p className="font-mono text-xs text-white/80 bg-white/10 px-3 py-2 rounded break-all">{group.id}</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-white/70 font-medium">Group Types:</span>
              <p className="text-white/80 bg-white/10 px-3 py-2 rounded">
                {group.groupTypes.length > 0 ? group.groupTypes.join(', ') : 'Unified'}
              </p>
            </div>
          </div>
        </div>

        {/* Members Section */}
        {group.members && group.members.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold text-white mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Members
              </span>
              <span className="bg-green-500/20 text-green-100 px-2 py-1 rounded-full text-xs font-medium border border-green-400/30">
                {group.members.length}
              </span>
            </h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {group.members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => onMemberSelect(member)}
                  className="w-full p-3 text-left bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 hover:shadow-md transition-all duration-200 hover:border-white/40"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-md ${
                      member['@odata.type'].includes('user') 
                        ? 'bg-gradient-to-br from-teal-400 to-teal-600' 
                        : 'bg-gradient-to-br from-purple-400 to-purple-600'
                    }`}>
                      {member.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">{member.displayName}</div>
                      {member.userPrincipalName && (
                        <div className="text-sm text-white/70 truncate">{member.userPrincipalName}</div>
                      )}
                      {member.mail && member.mail !== member.userPrincipalName && (
                        <div className="text-xs text-white/60 truncate">{member.mail}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {member['@odata.type'].includes('user') ? '👤' : '👥'}
                      </span>
                      <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Member Of Section */}
        {group.memberOf && group.memberOf.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold text-white mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                Member of
              </span>
              <span className="bg-orange-500/20 text-orange-100 px-2 py-1 rounded-full text-xs font-medium border border-orange-400/30">
                {group.memberOf.length}
              </span>
            </h4>
            <div className="space-y-2">
              {group.memberOf.map((parentGroup) => (
                <div
                  key={parentGroup.id}
                  className="p-4 bg-white/10 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white text-sm font-medium shadow-sm">
                      👥
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">{parentGroup.displayName}</div>
                      {parentGroup.description && (
                        <div className="text-sm text-white/70 mt-1">{parentGroup.description}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!group.members || group.members.length === 0) && (!group.memberOf || group.memberOf.length === 0) && (
          <div className="text-center py-8 text-white/70">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-sm">No additional group details available</p>
          </div>
        )}
      </div>
    </div>
  )
}
