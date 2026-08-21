import React, { useState } from 'react';
import {
  Code2,
  Users,
  PlusCircle,
  LogIn,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { createRoom, joinRoom } from '../lib/api';

const AVAILABLE_LANGS = [
  { id: 'python', name: 'Python', desc: 'Python 3.12 with standard libraries' },
  { id: 'javascript', name: 'JavaScript', desc: 'Node.js 22 runtime engine' },
  { id: 'cpp', name: 'C++', desc: 'C++20 compiled with GCC -O2' },
  { id: 'java', name: 'Java', desc: 'OpenJDK 21 runtime sandbox' },
  { id: 'json', name: 'JSON', desc: 'JSON structure & schema validation' },
  { id: 'html', name: 'HTML / Web', desc: 'Interactive HTML/CSS/JS live preview' },
];

export default function RoomDialog({ isOpen, user, onJoin, onClose }) {
  const [tab, setTab] = useState('create'); // 'create' | 'join'
  const [nickname, setNickname] = useState(user?.name || '');
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [customRoomId, setCustomRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const resp = await createRoom(selectedLanguage, customRoomId.trim() || null);
      if (resp && resp.room_id) {
        onJoin(resp.room_id, nickname, selectedLanguage);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create room.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinExistingRoom = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const cleanId = joinRoomId.trim().toUpperCase();

    if (!cleanId) {
      setErrorMessage('Please enter a room ID (e.g. ABCD-1234).');
      return;
    }

    setIsLoading(true);
    try {
      const resp = await joinRoom(cleanId, nickname);
      if (resp && resp.valid) {
        onJoin(cleanId, nickname);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid or inaccessible room ID.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#30363d] bg-gradient-to-b from-[#1c232d] to-[#161b22]">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Code2 size={24} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                CodeSync Workspace
              </h2>
              <p className="text-xs text-slate-400">
                Real-time collaborative code editor with sandboxed execution
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex rounded-lg bg-[#0d1117] p-1 border border-[#30363d] mt-4">
            <button
              onClick={() => {
                setTab('create');
                setErrorMessage('');
              }}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                tab === 'create'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PlusCircle size={14} />
              <span>Create Room</span>
            </button>

            <button
              onClick={() => {
                setTab('join');
                setErrorMessage('');
              }}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                tab === 'join'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn size={14} />
              <span>Join Room</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start space-x-2">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* User Nickname Input */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Your Collaborator Nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Alice, Bob, Dev-102"
              className="w-full bg-[#0d1117] border border-[#30363d] focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none transition-colors"
            />
          </div>

          {tab === 'create' ? (
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Select Project Template
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_LANGS.map((lang) => (
                    <div
                      key={lang.id}
                      onClick={() => setSelectedLanguage(lang.id)}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                        selectedLanguage === lang.id
                          ? 'border-blue-500 bg-blue-500/10 text-white'
                          : 'border-[#30363d] bg-[#0d1117]/50 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-semibold">{lang.name}</div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                        {lang.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Custom Room Code (Optional)
                </label>
                <input
                  type="text"
                  value={customRoomId}
                  onChange={(e) => setCustomRoomId(e.target.value)}
                  placeholder="Leave empty for auto-generated ABCD-1234"
                  className="w-full bg-[#0d1117] border border-[#30363d] focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-100 uppercase font-mono outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Create & Launch Room</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinExistingRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Room Identifier Code
                </label>
                <input
                  type="text"
                  required
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  placeholder="e.g. ABCD-1234"
                  className="w-full bg-[#0d1117] border border-[#30363d] focus:border-blue-500 rounded-lg px-3 py-2.5 text-sm text-slate-100 uppercase font-mono tracking-wider outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter the 8-character room code shared by your teammate.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <LogIn size={15} />
                    <span>Join Collaborative Session</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
