'use client'

import { Group, GroupMember, GroupDetailsProps } from '@/types'

export default function GroupDetails({ group, onMemberSelect }: GroupDetailsProps) {
  const isSecurityGroup = group.groupTypes.includes('Unified') ? false : true

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-xl font-semibold text-gray-800">{group.displayName}</h3>
          <span className={`px-2 py-1 text-xs rounded-full ${
            isSecurityGroup 
              ? 'bg-red-100 text-red-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {isSecurityGroup ? 'Security Group' : 'Microsoft 365 Group'}
          </span>
        </div>
        {group.description && (
          <p className="text-gray-600 text-sm">{group.description}</p>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-800 mb-2">Group Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Group ID:</span>
              <p className="font-mono text-xs text-gray-700 break-all">{group.id}</p>
            </div>
            <div>
              <span className="text-gray-500">Group Types:</span>
              <p className="text-gray-700">
                {group.groupTypes.length > 0 ? group.groupTypes.join(', ') : 'Security Group'}
              </p>
            </div>
          </div>
        </div>

        {group.members && group.members.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-800 mb-2">
              Members ({group.members.length})
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {group.members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => onMemberSelect(member)}
                  className="w-full p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {member.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{member.displayName}</div>
                      {member.userPrincipalName && (
                        <div className="text-sm text-gray-500">{member.userPrincipalName}</div>
                      )}
                      {member.mail && member.mail !== member.userPrincipalName && (
                        <div className="text-xs text-gray-400">{member.mail}</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {member['@odata.type'].includes('user') ? '👤' : '👥'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {group.memberOf && group.memberOf.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-800 mb-2">
              Member of ({group.memberOf.length})
            </h4>
            <div className="space-y-2">
              {group.memberOf.map((parentGroup) => (
                <div
                  key={parentGroup.id}
                  className="p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                >
                  <div className="font-medium text-gray-900">{parentGroup.displayName}</div>
                  {parentGroup.description && (
                    <div className="text-sm text-gray-600">{parentGroup.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
