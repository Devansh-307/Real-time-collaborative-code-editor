import React, { useState } from 'react';
import {
  FilePlus,
  FolderTree,
  Trash2,
  Edit2,
  FileCode,
  FileText,
  FileJson,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

export default function FileExplorer({
  files = [],
  activeFileId,
  onSelectFile,
  onAddFile,
  onRenameFile,
  onDeleteFile,
  collaborators = [],
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingFileId, setEditingFileId] = useState(null);
  const [editingFileName, setEditingFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'py':
        return <FileCode size={14} className="text-blue-400" />;
      case 'js':
      case 'jsx':
        return <FileCode size={14} className="text-yellow-400" />;
      case 'cpp':
      case 'cc':
      case 'h':
      case 'hpp':
        return <FileCode size={14} className="text-sky-400" />;
      case 'java':
        return <FileCode size={14} className="text-orange-400" />;
      case 'json':
        return <FileJson size={14} className="text-emerald-400" />;
      case 'html':
        return <FileCode size={14} className="text-rose-400" />;
      case 'css':
        return <FileCode size={14} className="text-indigo-400" />;
      default:
        return <FileText size={14} className="text-slate-400" />;
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    const name = newFileName.trim();

    if (!name) {
      setErrorMessage('Filename cannot be empty.');
      return;
    }
    if (name.includes('/') || name.includes('\\') || name.includes('..')) {
      setErrorMessage('Invalid filename: path traversal is prohibited.');
      return;
    }
    if (files.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
      setErrorMessage('A file with this name already exists.');
      return;
    }
    if (files.length >= 30) {
      setErrorMessage('Maximum file limit (30) reached.');
      return;
    }

    try {
      onAddFile(name);
      setNewFileName('');
      setIsCreating(false);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const handleRenameSubmit = (e, fileId) => {
    e.preventDefault();
    setErrorMessage('');
    const name = editingFileName.trim();

    if (!name) {
      setErrorMessage('Filename cannot be empty.');
      return;
    }
    if (name.includes('/') || name.includes('\\') || name.includes('..')) {
      setErrorMessage('Invalid filename: path traversal is prohibited.');
      return;
    }
    if (files.some((f) => f.id !== fileId && f.name.toLowerCase() === name.toLowerCase())) {
      setErrorMessage('A file with this name already exists.');
      return;
    }

    onRenameFile(fileId, name);
    setEditingFileId(null);
    setEditingFileName('');
  };

  return (
    <div className="w-60 border-r border-[#30363d] bg-[#161b22] text-[#c9d1d9] flex flex-col h-full select-none flex-shrink-0">
      {/* Explorer Header */}
      <div className="h-10 px-3 border-b border-[#30363d] flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <FolderTree size={14} className="text-blue-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Explorer
          </span>
          <span className="text-[10px] text-slate-400 bg-[#21262d] px-1.5 py-0.2 rounded">
            {files.length}/30
          </span>
        </div>

        <button
          onClick={() => {
            setIsCreating(true);
            setErrorMessage('');
          }}
          disabled={files.length >= 30}
          title="New File"
          className="p-1 hover:bg-[#21262d] rounded text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-40"
        >
          <FilePlus size={15} />
        </button>
      </div>

      {/* Error notification */}
      {errorMessage && (
        <div className="m-2 p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] flex items-start space-x-1.5">
          <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto py-1 px-1.5 space-y-0.5">
        {/* Create new file inline form */}
        {isCreating && (
          <form onSubmit={handleCreateSubmit} className="flex items-center space-x-1 p-1 bg-[#21262d] rounded border border-blue-500/40">
            <FileCode size={13} className="text-blue-400 flex-shrink-0 ml-1" />
            <input
              type="text"
              autoFocus
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="filename.py"
              className="w-full bg-transparent text-xs text-slate-100 outline-none font-mono"
            />
            <button type="submit" className="p-0.5 hover:text-emerald-400 text-slate-400">
              <Check size={13} />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setErrorMessage('');
              }}
              className="p-0.5 hover:text-rose-400 text-slate-400"
            >
              <X size={13} />
            </button>
          </form>
        )}

        {files.map((file) => {
          const isActive = file.id === activeFileId;
          const isEditing = editingFileId === file.id;
          
          // Find peers viewing this file
          const peersViewing = collaborators.filter(
            (peer) => peer.activeFile === file.id && !peer.isSelf
          );

          if (isEditing) {
            return (
              <form
                key={file.id}
                onSubmit={(e) => handleRenameSubmit(e, file.id)}
                className="flex items-center space-x-1 p-1 bg-[#21262d] rounded border border-yellow-500/40"
              >
                {getFileIcon(editingFileName || file.name)}
                <input
                  type="text"
                  autoFocus
                  value={editingFileName}
                  onChange={(e) => setEditingFileName(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-100 outline-none font-mono"
                />
                <button type="submit" className="p-0.5 hover:text-emerald-400 text-slate-400">
                  <Check size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingFileId(null)}
                  className="p-0.5 hover:text-rose-400 text-slate-400"
                >
                  <X size={13} />
                </button>
              </form>
            );
          }

          return (
            <div
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              className={`group flex items-center justify-between px-2 py-1.5 rounded-md text-xs cursor-pointer transition-all ${
                isActive
                  ? 'bg-[#21262d] text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:bg-[#21262d]/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2 min-w-0 pr-1">
                {getFileIcon(file.name)}
                <span className="truncate font-mono text-[12px]">{file.name}</span>
                {file.isEntry && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans">
                    main
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-1">
                {/* Active peer badges */}
                {peersViewing.length > 0 && (
                  <div className="flex -space-x-1 mr-1">
                    {peersViewing.map((peer) => (
                      <div
                        key={peer.clientId}
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow ring-1 ring-[#161b22]"
                        style={{ backgroundColor: peer.color }}
                        title={`${peer.name} is viewing this file`}
                      >
                        {peer.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>
                )}

                {/* Rename & Delete controls on hover */}
                <div className="hidden group-hover:flex items-center space-x-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingFileId(file.id);
                      setEditingFileName(file.name);
                    }}
                    title="Rename File"
                    className="p-1 hover:bg-[#30363d] rounded text-slate-400 hover:text-yellow-400"
                  >
                    <Edit2 size={12} />
                  </button>

                  {files.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete ${file.name}?`)) {
                          onDeleteFile(file.id);
                        }
                      }}
                      title="Delete File"
                      className="p-1 hover:bg-[#30363d] rounded text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
