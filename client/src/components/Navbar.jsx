import React, { useState } from 'react';
import {
  Play,
  Copy,
  Check,
  Share2,
  Users,
  Sun,
  Moon,
  LogOut,
  Code2,
  Eye,
  Terminal as TerminalIcon,
  SidebarClose,
  SidebarOpen,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import LanguageSelector from './LanguageSelector';

export default function Navbar({
  roomId,
  connectionStatus,
  collaborators = [],
  selectedLanguage,
  onSelectLanguage,
  languages = [],
  onRun,
  isRunning,
  theme,
  onToggleTheme,
  onLeaveRoom,
  isExplorerOpen,
  onToggleExplorer,
  isOutputOpen,
  onToggleOutput,
  isPreviewOpen,
  onTogglePreview,
  showPreviewToggle = false,
  showCollabPanel,
  onToggleCollabPanel,
  onOpenShare,
}) {
  const [copied, setCopied] = useState(false);

  const handleQuickCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    if (onOpenShare) {
      onOpenShare();
    }
  };

  const isConnected = connectionStatus === 'connected';
  const isConnecting = connectionStatus === 'connecting';

  return (
    <header className="h-14 border-b border-[#30363d] bg-[#161b22] text-[#c9d1d9] flex items-center justify-between px-2 sm:px-4 select-none z-30 flex-shrink-0 gap-1 sm:gap-3">
        {/* Left section: Controls & Room Info */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 min-w-0">
          {/* Toggle file explorer button */}
          <button
            onClick={onToggleExplorer}
            title="Toggle File Explorer (Ctrl+B)"
            className={`p-1.5 rounded-md transition-colors ${
              isExplorerOpen ? 'bg-[#21262d] text-sky-400' : 'hover:bg-[#21262d] text-slate-400'
            }`}
          >
            {isExplorerOpen ? <SidebarClose size={18} /> : <SidebarOpen size={18} />}
          </button>

          {/* Logo (Compact on mobile) */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20 text-white flex-shrink-0">
              <Code2 size={18} className="stroke-[2.5]" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white hidden md:inline">
              CodeSync
            </span>
          </div>

          {/* Room Code Badge & Share Button (Always Visible) */}
          <div
            onClick={handleShareClick}
            className="flex items-center bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-lg px-2 py-1 space-x-1.5 cursor-pointer transition-colors"
            title="Click to Share Room"
          >
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs font-bold text-sky-400 tracking-wide">
                {roomId}
              </span>
            </div>

            <button
              onClick={handleQuickCopy}
              title="Quick Copy Room ID"
              className="p-1 hover:bg-[#161b22] rounded text-slate-400 hover:text-slate-100 transition-colors"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            </button>

            <div
              className="flex items-center space-x-1 px-1.5 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-semibold transition-colors shadow-sm"
            >
              <Share2 size={11} />
              <span>Share</span>
            </div>
          </div>

          {/* Real-time Connection Status Dot */}
          <div
            className="hidden sm:flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium bg-[#0d1117] border border-[#30363d]"
            title={`Status: ${connectionStatus}`}
          >
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-emerald-400 text-[10px] hidden lg:inline">Live Sync</span>
              </>
            ) : isConnecting ? (
              <>
                <RefreshCw size={11} className="animate-spin text-amber-400" />
                <span className="text-amber-400 text-[10px] hidden lg:inline">Syncing</span>
              </>
            ) : (
              <>
                <WifiOff size={11} className="text-rose-400" />
                <span className="text-rose-400 text-[10px] hidden lg:inline">Offline</span>
              </>
            )}
          </div>
        </div>

      {/* Center section: Execution & Language Selection */}
      <div className="flex items-center space-x-2">
        <LanguageSelector
          languages={languages}
          selectedLanguage={selectedLanguage}
          onSelect={onSelectLanguage}
        />

        {/* Run Button */}
        <button
          onClick={onRun}
          disabled={isRunning}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md font-medium text-xs shadow-md transition-all ${
            isRunning
              ? 'bg-blue-700/60 text-blue-200 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-emerald-900/30'
          }`}
          title="Run Code (Ctrl+Enter)"
        >
          {isRunning ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>Running...</span>
            </>
          ) : (
            <>
              <Play size={14} className="fill-current" />
              <span>Run</span>
              <kbd className="hidden lg:inline-block ml-1 px-1.5 py-0.5 text-[9px] bg-emerald-800/60 rounded text-emerald-200 border border-emerald-700">
                Ctrl+Enter
              </kbd>
            </>
          )}
        </button>

        {/* HTML / Live Preview Toggle if enabled */}
        {showPreviewToggle && (
          <button
            onClick={onTogglePreview}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              isPreviewOpen
                ? 'bg-indigo-600 text-white'
                : 'bg-[#21262d] text-slate-300 hover:bg-[#30363d]'
            }`}
            title="Toggle Live Web Preview"
          >
            <Eye size={14} />
            <span className="hidden sm:inline">Preview</span>
          </button>
        )}
      </div>

      {/* Right section: Collaborators, Theme, Output, Room exit */}
      <div className="flex items-center space-x-2">
        {/* Collaborators Avatar Stack */}
        <div
          onClick={onToggleCollabPanel}
          className="flex items-center bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] px-2 py-1 rounded-md cursor-pointer transition-colors"
          title={`${collaborators.length} collaborator(s) online. Click to view.`}
        >
          <div className="flex -space-x-1.5 mr-1.5 overflow-hidden">
            {collaborators.slice(0, 3).map((peer) => (
              <div
                key={peer.clientId}
                className="w-5 h-5 rounded-full border border-[#161b22] flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                style={{ backgroundColor: peer.color }}
                title={`${peer.name} ${peer.isSelf ? '(You)' : ''}`}
              >
                {peer.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          <span className="text-xs font-medium text-slate-300">
            {collaborators.length}
          </span>
        </div>

        {/* Toggle Output Panel */}
        <button
          onClick={onToggleOutput}
          title="Toggle Terminal & Output (Ctrl+J)"
          className={`p-1.5 rounded-md text-slate-400 hover:text-slate-200 transition-colors ${
            isOutputOpen ? 'bg-[#21262d] text-sky-400' : 'hover:bg-[#21262d]'
          }`}
        >
          <TerminalIcon size={17} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="p-1.5 rounded-md hover:bg-[#21262d] text-slate-400 hover:text-slate-200 transition-colors"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Leave Room Button */}
        <button
          onClick={onLeaveRoom}
          title="Leave Room"
          className="p-1.5 rounded-md hover:bg-rose-900/30 text-slate-400 hover:text-rose-400 transition-colors"
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
