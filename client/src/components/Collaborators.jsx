import React from 'react';
import { Users, FileText, CheckCircle2, Copy, X } from 'lucide-react';

export default function Collaborators({
  collaborators = [],
  files = [],
  onClose,
  roomId,
  onOpenShare,
}) {
  const getFileName = (fileId) => {
    if (!fileId) return 'Browsing';
    const found = files.find((f) => f.id === fileId);
    return found ? found.name : 'Unknown File';
  };

  return (
    <aside className="w-72 border-l border-[#30363d] bg-[#161b22] text-[#c9d1d9] flex flex-col h-full select-none z-20 flex-shrink-0">
      {/* Header */}
      <div className="h-10 px-4 border-b border-[#30363d] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users size={15} className="text-sky-400" />
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Collaborators ({collaborators.length})
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#21262d] rounded text-slate-400 hover:text-slate-200"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Invite Action Button */}
      {onOpenShare && (
        <div className="p-3 border-b border-[#30363d]/70 bg-[#0d1117]/30">
          <button
            onClick={onOpenShare}
            className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-sm shadow-blue-600/20 transition-all active:scale-95"
          >
            <Users size={14} />
            <span>Invite Collaborators</span>
          </button>
        </div>
      )}

      {/* Collaborator List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {collaborators.map((peer) => (
          <div
            key={peer.clientId}
            className={`p-2.5 rounded-lg border transition-all ${
              peer.isSelf
                ? 'bg-[#21262d]/70 border-sky-500/40'
                : 'bg-[#21262d]/40 border-[#30363d]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                {/* Avatar with persistent color */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm ring-2 ring-[#0d1117]"
                  style={{ backgroundColor: peer.color }}
                >
                  {peer.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-semibold text-slate-200">
                      {peer.name}
                    </span>
                    {peer.isSelf && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                        YOU
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Client ID: {peer.clientId}
                  </span>
                </div>
              </div>

              <div className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-950"></span>
              </div>
            </div>

            {/* Active File Indicator */}
            <div className="mt-2 pt-2 border-t border-[#30363d]/60 flex items-center space-x-1.5 text-[11px] text-slate-400">
              <FileText size={12} className="text-slate-400 flex-shrink-0" />
              <span className="truncate">
                Editing: <span className="text-slate-200 font-mono">{getFileName(peer.activeFile)}</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Info Footer */}
      <div className="p-3 border-t border-[#30363d] bg-[#0d1117]/50">
        <div className="text-[11px] text-slate-400 space-y-1">
          <div className="flex justify-between">
            <span>Room ID:</span>
            <span className="font-mono text-sky-400 font-semibold">{roomId}</span>
          </div>
          <div className="flex justify-between">
            <span>CRDT Engine:</span>
            <span className="text-slate-300">Yjs Conflict-Free</span>
          </div>
          <div className="flex justify-between">
            <span>Presence:</span>
            <span className="text-emerald-400">Awareness v2</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
