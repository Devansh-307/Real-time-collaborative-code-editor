import React from 'react';
import { UserPresence, UserInfo } from '../types';
import { Users } from 'lucide-react';

interface CollaboratorsProps {
  collaborators: UserPresence[];
  currentUser: UserInfo;
}

export const Collaborators: React.FC<CollaboratorsProps> = ({
  collaborators,
  currentUser,
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs text-slate-300">
        <Users className="w-3.5 h-3.5 text-sky-400" />
        <span className="font-semibold text-white">{collaborators.length}</span>
        <span className="text-slate-400">online</span>
      </div>

      <div className="flex items-center -space-x-1.5 overflow-hidden">
        {collaborators.map((c) => {
          const isSelf = c.user.id === currentUser.id;
          const initials = c.user.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

          return (
            <div
              key={c.clientId}
              title={`${c.user.name}${isSelf ? ' (You)' : ''}`}
              style={{
                backgroundColor: c.user.color,
                borderColor: '#0f172a',
              }}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-900 border-2 shadow-sm transition-transform hover:scale-110 hover:z-10 cursor-pointer ${
                isSelf ? 'ring-2 ring-sky-400' : ''
              }`}
            >
              {initials}
            </div>
          );
        })}
      </div>
    </div>
  );
};
