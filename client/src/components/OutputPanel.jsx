import React, { useState, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  FileInput,
  Eye,
  FileJson,
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
} from 'lucide-react';
import Terminal from './Terminal';

export default function OutputPanel({
  output,
  isRunning,
  onClear,
  stdin,
  onStdinChange,
  activeFile,
  allFiles = [],
  onClose,
  activeTab = 'console',
  onTabChange,
}) {
  const [htmlSrcDoc, setHtmlSrcDoc] = useState('');
  const [jsonValidation, setJsonValidation] = useState({ valid: true, error: '' });

  // Update HTML sandboxed iframe whenever files change
  useEffect(() => {
    if (activeTab === 'preview') {
      const htmlFile = allFiles.find((f) => f.name.endsWith('.html')) || activeFile;
      if (htmlFile && htmlFile.content) {
        setHtmlSrcDoc(htmlFile.content);
      }
    }
  }, [allFiles, activeFile, activeTab]);

  // Update JSON validation
  useEffect(() => {
    if (activeTab === 'json' && activeFile?.content) {
      try {
        JSON.parse(activeFile.content);
        setJsonValidation({ valid: true, error: '' });
      } catch (err) {
        setJsonValidation({ valid: false, error: err.message });
      }
    }
  }, [activeFile?.content, activeTab]);

  return (
    <div className="h-64 border-t border-[#30363d] bg-[#161b22] flex flex-col flex-shrink-0 select-none z-10">
      {/* Panel Tab Navigation Bar */}
      <div className="h-9 px-3 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-1">
          {/* Console Tab */}
          <button
            onClick={() => onTabChange('console')}
            className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-medium rounded-t border-b-2 transition-colors ${
              activeTab === 'console'
                ? 'border-blue-500 text-white bg-[#0d1117]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TerminalIcon size={13} />
            <span>Output</span>
            {output?.exit_code !== undefined && (
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  output.exit_code === 0 ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
            )}
          </button>

          {/* Stdin Tab */}
          <button
            onClick={() => onTabChange('stdin')}
            className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-medium rounded-t border-b-2 transition-colors ${
              activeTab === 'stdin'
                ? 'border-blue-500 text-white bg-[#0d1117]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileInput size={13} />
            <span>Stdin (Input)</span>
            {stdin?.trim() && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            )}
          </button>

          {/* Live Web Preview Tab */}
          <button
            onClick={() => onTabChange('preview')}
            className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-medium rounded-t border-b-2 transition-colors ${
              activeTab === 'preview'
                ? 'border-blue-500 text-white bg-[#0d1117]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye size={13} />
            <span>Web Preview</span>
          </button>

          {/* JSON Validator Tab */}
          {activeFile?.name?.endsWith('.json') && (
            <button
              onClick={() => onTabChange('json')}
              className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-medium rounded-t border-b-2 transition-colors ${
                activeTab === 'json'
                  ? 'border-blue-500 text-white bg-[#0d1117]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileJson size={13} />
              <span>JSON Lint</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  jsonValidation.valid ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
            </button>
          )}
        </div>

        {/* Close Button */}
        <div className="flex items-center space-x-1">
          {onClose && (
            <button
              onClick={onClose}
              title="Close Output Panel (Ctrl+J)"
              className="p-1 hover:bg-[#21262d] rounded text-slate-400 hover:text-slate-200"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Panel Body Content */}
      <div className="flex-1 bg-[#0d1117] overflow-hidden relative">
        {activeTab === 'console' && (
          <Terminal
            output={output}
            isRunning={isRunning}
            onClear={onClear}
          />
        )}

        {activeTab === 'stdin' && (
          <div className="p-3 h-full flex flex-col">
            <div className="text-xs text-slate-400 mb-2 flex items-center justify-between">
              <span>Standard Input stream (piped to process on run):</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Blob([stdin || '']).size} / 65536 bytes
              </span>
            </div>
            <textarea
              value={stdin}
              onChange={(e) => onStdinChange(e.target.value)}
              placeholder="Enter standard input (stdin) lines here to pass to your program..."
              className="flex-1 w-full bg-[#161b22] border border-[#30363d] rounded-md p-2.5 text-slate-100 font-mono text-xs outline-none focus:border-blue-500 resize-none"
            />
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="h-full w-full bg-white flex flex-col">
            <iframe
              title="CodeSync Sandboxed Live Preview"
              srcDoc={htmlSrcDoc}
              sandbox="allow-scripts"
              className="w-full h-full border-none"
            />
          </div>
        )}

        {activeTab === 'json' && (
          <div className="p-4 h-full overflow-y-auto">
            {jsonValidation.valid ? (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                ✓ Valid JSON syntax detected.
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
                ✕ JSON Syntax Error: {jsonValidation.error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
