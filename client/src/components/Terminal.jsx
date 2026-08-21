import React from 'react';
import { Copy, Trash2, Check, Clock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export default function Terminal({
  output = {},
  isRunning = false,
  onClear,
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    const text = `${output.stdout || ''}\n${output.stderr || ''}`;
    navigator.clipboard.writeText(text.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasOutput = Boolean(output.stdout || output.stderr);
  const isSuccess = output.exit_code === 0 && !output.timed_out;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d1117] text-slate-200 font-mono text-xs overflow-hidden">
      {/* Terminal Toolbar */}
      <div className="h-8 bg-[#161b22] border-b border-[#30363d] px-3 flex items-center justify-between select-none">
        {/* Status Indicators */}
        <div className="flex items-center space-x-3">
          {output.status && (
            <div className="flex items-center space-x-1.5">
              {output.timed_out ? (
                <span className="flex items-center space-x-1 text-amber-400 font-medium">
                  <AlertTriangle size={13} />
                  <span>Timed Out</span>
                </span>
              ) : isSuccess ? (
                <span className="flex items-center space-x-1 text-emerald-400 font-medium">
                  <CheckCircle2 size={13} />
                  <span>Success (exit {output.exit_code})</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-rose-400 font-medium">
                  <XCircle size={13} />
                  <span>Failed (exit {output.exit_code})</span>
                </span>
              )}
            </div>
          )}

          {output.elapsed_ms !== undefined && (
            <div className="flex items-center space-x-1 text-slate-400">
              <Clock size={12} />
              <span>{output.elapsed_ms} ms</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1">
          {hasOutput && (
            <>
              <button
                onClick={handleCopy}
                title="Copy Terminal Output"
                className="p-1 hover:bg-[#21262d] rounded text-slate-400 hover:text-slate-200 transition-colors"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              </button>
              <button
                onClick={onClear}
                title="Clear Output"
                className="p-1 hover:bg-[#21262d] rounded text-slate-400 hover:text-slate-200 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Output Console Display */}
      <div className="flex-1 p-3 overflow-y-auto font-mono text-[13px] leading-relaxed whitespace-pre-wrap select-text">
        {isRunning && (
          <div className="text-sky-400 flex items-center space-x-2 animate-pulse mb-2">
            <span>Executing inside isolated Docker sandbox container...</span>
          </div>
        )}

        {!hasOutput && !isRunning && (
          <div className="text-slate-400 italic py-2">
            No execution output yet. Press "Run" or press Ctrl+Enter / Cmd+Enter to execute.
          </div>
        )}

        {/* Standard Output */}
        {output.stdout && (
          <div className="text-slate-100">{output.stdout}</div>
        )}

        {/* Standard Error / Compilation Errors */}
        {output.stderr && (
          <div className="text-rose-400 mt-2 font-medium">{output.stderr}</div>
        )}
      </div>
    </div>
  );
}
