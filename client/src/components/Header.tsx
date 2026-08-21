import React, { useState } from 'react';
import { Play, Share2, Check, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { LanguageOption, UserPresence, UserInfo, ExecutionStatus } from '../types';
import { LanguageSelect } from './LanguageSelect';
import { Collaborators } from './Collaborators';

interface HeaderProps {
  room: string;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  collaborators: UserPresence[];
  currentUser: UserInfo;
  currentLanguage: LanguageOption;
  onSelectLanguage: (language: LanguageOption) => void;
  onRunCode: () => void;
  executionStatus: ExecutionStatus;
}

export const Header: React.FC<HeaderProps> = ({
  room,
  connectionStatus,
  collaborators,
  currentUser,
  currentLanguage,
  onSelectLanguage,
  onRunCode,
  executionStatus,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="h-14 bg-[#12161f] border-b border-slate-800 px-4 flex items-center justify-between select-none z-20">
      {/* Left section: App branding & Room info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              CollabCode <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded">CRDT + Docker</span>
            </h1>
            <p className="text-[11px] text-slate-400">Real-Time Sandboxed Workspace</p>
          </div>
        </div>

        {/* Room Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs text-slate-300">
          <span className="text-slate-400">Room:</span>
          <span className="font-semibold text-sky-400">{room}</span>
          <button
            onClick={handleCopyLink}
            title="Copy room invitation link"
            className="ml-1 p-1 hover:text-white text-slate-400 hover:bg-slate-700 rounded transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Connection status */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs">
          {connectionStatus === 'connected' ? (
            <span className="flex items-center gap-1 text-emerald-400">
              <Wifi className="w-3.5 h-3.5" />
              <span>Synced</span>
            </span>
          ) : connectionStatus === 'connecting' ? (
            <span className="flex items-center gap-1 text-amber-400 animate-pulse">
              <Wifi className="w-3.5 h-3.5" />
              <span>Connecting...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-rose-400">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline</span>
            </span>
          )}
        </div>
      </div>

      {/* Right section: Controls */}
      <div className="flex items-center gap-3">
        {/* Active Collaborators */}
        <Collaborators collaborators={collaborators} currentUser={currentUser} />

        {/* Language selector */}
        <LanguageSelect
          currentLanguage={currentLanguage}
          onSelectLanguage={onSelectLanguage}
          disabled={executionStatus === 'running'}
        />

        {/* Run code button */}
        <button
          onClick={onRunCode}
          disabled={executionStatus === 'running'}
          className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-95 text-white font-medium text-sm rounded-lg shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {executionStatus === 'running' ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Running...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Run Code</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
