import React, { useState } from 'react';
import { ExecutionResult, ExecutionStatus } from '../types';
import { Terminal, Play, CheckCircle2, AlertCircle, Clock, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface OutputPanelProps {
  status: ExecutionStatus;
  result: ExecutionResult | null;
  stdin: string;
  onStdinChange: (stdin: string) => void;
  onClear: () => void;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
  status,
  result,
  stdin,
  onStdinChange,
  onClear,
}) => {
  const [showStdin, setShowStdin] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[#0b0e14] border-t md:border-t-0 md:border-l border-slate-800/80 font-mono">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#121722] border-b border-slate-800 text-xs select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-slate-200 tracking-wide">EXECUTION CONSOLE</span>
          
          {/* Status Badge */}
          {status === 'running' && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              Running in Docker...
            </span>
          )}
          {status === 'success' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px]">
              <CheckCircle2 className="w-3 h-3" />
              Exit 0
            </span>
          )}
          {status === 'error' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[11px]">
              <AlertCircle className="w-3 h-3" />
              Exit {result?.exitCode ?? 'Err'}
            </span>
          )}
          {status === 'timeout' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px]">
              <Clock className="w-3 h-3" />
              Timed Out (Limit Exceeded)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {result && (
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {result.durationMs}ms
            </span>
          )}
          <button
            onClick={() => setShowStdin(!showStdin)}
            className={`px-2 py-1 rounded text-[11px] flex items-center gap-1 transition-colors ${
              showStdin || stdin
                ? 'bg-slate-700 text-sky-300'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Custom Input {showStdin ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <button
            onClick={onClear}
            title="Clear console"
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable Stdin Drawer */}
      {showStdin && (
        <div className="p-3 bg-[#0d121c] border-b border-slate-800/80">
          <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
            Standard Input (stdin)
          </label>
          <textarea
            value={stdin}
            onChange={(e) => onStdinChange(e.target.value)}
            placeholder="Type input to feed into the program..."
            rows={2}
            className="w-full bg-[#080b10] border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono resize-none"
          />
        </div>
      )}

      {/* Output Content Area */}
      <div className="flex-1 p-4 overflow-auto text-xs leading-relaxed selection:bg-sky-900 selection:text-sky-200">
        {status === 'idle' && !result && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center gap-2">
            <Play className="w-6 h-6 text-slate-600 stroke-[1.5]" />
            <p>Click "Run Code" to execute inside isolated Docker container</p>
            <span className="text-[11px] text-slate-600">
              Sandboxed with no network, 128MB RAM & CPU limits
            </span>
          </div>
        )}

        {status === 'running' && (
          <div className="flex items-center gap-2 text-sky-400 py-2">
            <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            <span>Spawning isolated Docker sandbox and executing...</span>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            {result.stdout && (
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                  STDOUT:
                </span>
                <pre className="text-emerald-300/90 whitespace-pre-wrap break-all bg-emerald-950/20 p-2.5 rounded border border-emerald-900/30">
                  {result.stdout}
                </pre>
              </div>
            )}

            {result.stderr && (
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider block mb-1">
                  STDERR:
                </span>
                <pre className="text-rose-300/90 whitespace-pre-wrap break-all bg-rose-950/20 p-2.5 rounded border border-rose-900/30">
                  {result.stderr}
                </pre>
              </div>
            )}

            {!result.stdout && !result.stderr && (
              <div className="text-slate-500 italic py-2">
                (Program finished with no output)
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
