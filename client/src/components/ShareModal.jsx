import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  X,
  Send,
  MessageSquare,
  Mail,
  ExternalLink,
  Users,
} from 'lucide-react';

export default function ShareModal({ isOpen, onClose, roomId }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const joinUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
  const shareText = `Join my live collaborative coding session on CodeSync (Room: ${roomId}):\n${joinUrl}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'CodeSync Collaborative Session',
          text: `Join my live coding room (${roomId}) on CodeSync:`,
          url: joinUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const openWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const openTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(joinUrl)}&text=${encodeURIComponent(`Join my live coding room (${roomId}) on CodeSync`)}`, '_blank');
  };

  const openEmail = () => {
    window.open(`mailto:?subject=${encodeURIComponent(`Join CodeSync Room ${roomId}`)}&body=${encodeURIComponent(shareText)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#30363d] bg-gradient-to-b from-[#1c232d] to-[#161b22] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <Share2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Share Coding Session
              </h3>
              <p className="text-xs text-slate-400">
                Collaborate & code together in real time
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#30363d] text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Quick Action Share Apps */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Share to Apps
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* WhatsApp Button */}
              <button
                onClick={openWhatsApp}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#21262d] hover:bg-[#283038] border border-[#30363d] text-slate-200 hover:text-emerald-400 transition-all active:scale-95 group"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <MessageSquare size={16} />
                </div>
                <span className="text-xs font-medium">WhatsApp</span>
              </button>

              {/* Telegram Button */}
              <button
                onClick={openTelegram}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#21262d] hover:bg-[#283038] border border-[#30363d] text-slate-200 hover:text-sky-400 transition-all active:scale-95 group"
              >
                <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <Send size={16} />
                </div>
                <span className="text-xs font-medium">Telegram</span>
              </button>

              {/* Email Button */}
              <button
                onClick={openEmail}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#21262d] hover:bg-[#283038] border border-[#30363d] text-slate-200 hover:text-amber-400 transition-all active:scale-95 group"
              >
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <Mail size={16} />
                </div>
                <span className="text-xs font-medium">Email</span>
              </button>
            </div>
          </div>

          {/* System Share (Mobile / Tablet) */}
          {typeof navigator !== 'undefined' && navigator.share && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all active:scale-98"
            >
              <Share2 size={15} />
              <span>Open Phone / Device Share Sheet</span>
            </button>
          )}

          {/* Room Code Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Room Identifier Code
            </label>
            <div className="flex items-center justify-between bg-[#0d1117] border border-[#30363d] rounded-xl p-3">
              <span className="font-mono text-xl font-bold text-sky-400 tracking-widest select-all">
                {roomId}
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-slate-200 rounded-lg text-xs font-medium border border-[#30363d] transition-all active:scale-95"
              >
                {copiedCode ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Direct Share Link Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Direct Join Link
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={joinUrl}
                className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2.5 text-xs text-slate-200 font-mono select-all outline-none truncate"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-[#21262d] hover:bg-[#30363d] text-slate-100 rounded-xl text-xs font-semibold border border-[#30363d] transition-all active:scale-95 flex-shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#30363d] bg-[#0d1117] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
