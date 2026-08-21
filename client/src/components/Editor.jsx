import React, { useRef, useEffect, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { MonacoBinding } from 'y-monaco';
import { FileCode, Loader2, ZoomIn, ZoomOut } from 'lucide-react';

export default function Editor({
  activeFile,
  getYText,
  awareness,
  theme = 'dark',
  onRun,
  onToggleExplorer,
  onToggleOutput,
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const bindingRef = useRef(null);
  const [editorReady, setEditorReady] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    // Default font size: slightly larger for mobile screens
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 15;
    }
    return 14;
  });

  const handleZoomIn = () => {
    setFontSize((prev) => Math.min(prev + 2, 28));
  };

  const handleZoomOut = () => {
    setFontSize((prev) => Math.max(prev - 2, 10));
  };

  // Determine Monaco language from file extension
  const getMonacoLanguage = (filename = '') => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'py':
        return 'python';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'cpp':
      case 'cc':
      case 'h':
      case 'hpp':
        return 'cpp';
      case 'java':
        return 'java';
      case 'json':
        return 'json';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'md':
        return 'markdown';
      default:
        return 'plaintext';
    }
  };

  // Setup / Rebind Monaco Editor with Yjs CRDT model when active file changes
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !activeFile || !awareness) return;

    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    const yText = getYText(activeFile.id);
    if (!yText) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor.getModel();

    if (model) {
      monaco.editor.setModelLanguage(model, getMonacoLanguage(activeFile.name));

      try {
        const binding = new MonacoBinding(
          yText,
          model,
          new Set([editor]),
          awareness
        );
        bindingRef.current = binding;
      } catch (err) {
        console.error('MonacoBinding initialization error:', err);
      }
    }

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [activeFile?.id, activeFile?.name, getYText, awareness]);

  // Handle Monaco mount and register shortcuts
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setEditorReady(true);

    // 1. Run Code: Ctrl+Enter / Cmd+Enter
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (onRun) onRun();
    });

    // 2. Toggle Explorer: Ctrl+B / Cmd+B
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      if (onToggleExplorer) onToggleExplorer();
    });

    // 3. Toggle Output: Ctrl+J / Cmd+J
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ, () => {
      if (onToggleOutput) onToggleOutput();
    });

    // 4. Save: Ctrl+S / Cmd+S (Prevent default browser save)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {});

    editor.focus();
  };

  const monacoTheme = theme === 'dark' ? 'vs-dark' : 'light';

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d1117] overflow-hidden relative">
      {/* File Tab Bar with Zoom & Template Controls */}
      <div className="h-9 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between px-2 sm:px-3 select-none flex-shrink-0 gap-2">
        <div className="flex items-center space-x-2 min-w-0">
          {activeFile ? (
            <div className="flex items-center space-x-2 px-3 py-1 bg-[#0d1117] border-t-2 border-blue-500 border-x border-[#30363d] rounded-t text-xs font-medium text-slate-200 shadow-inner truncate">
              <FileCode size={13} className="text-blue-400 flex-shrink-0" />
              <span className="font-mono text-[12px] truncate">{activeFile.name}</span>
            </div>
          ) : (
            <div className="text-xs text-slate-400">No file open</div>
          )}

          {/* Quick Template Picker Button */}
          {onOpenTemplates && (
            <button
              onClick={onOpenTemplates}
              title="Insert Starter Templates / Presets"
              className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-sky-400 border border-[#30363d] text-[11px] font-medium transition-colors"
            >
              <span>⚡ Templates</span>
            </button>
          )}
        </div>

        {/* Zoom In / Out Toolbar Controls */}
        <div className="flex items-center space-x-1 flex-shrink-0">
          <button
            onClick={handleZoomOut}
            title="Zoom Out Code (Decrease Font Size)"
            className="p-1 hover:bg-[#21262d] rounded text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-[10px] font-mono text-slate-400 px-1 select-none">
            {fontSize}px
          </span>
          <button
            onClick={handleZoomIn}
            title="Zoom In Code (Increase Font Size)"
            className="p-1 hover:bg-[#21262d] rounded text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      {/* Monaco Container */}
      <div className="flex-1 relative overflow-hidden">
        <MonacoEditor
          height="100%"
          language={activeFile ? getMonacoLanguage(activeFile.name) : 'plaintext'}
          theme={monacoTheme}
          loading={
            <div className="flex items-center justify-center h-full space-x-2 text-slate-400">
              <Loader2 className="animate-spin text-blue-500" size={20} />
              <span className="text-sm">Initializing Monaco Editor...</span>
            </div>
          }
          onMount={handleEditorDidMount}
          options={{
            fontSize: fontSize,
            fontFamily: "'Fira Code', 'JetBrains Mono', Menlo, Monaco, Consolas, monospace",
            fontLigatures: true,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: 'on',
            lineNumbers: 'on',
            minimap: { enabled: typeof window !== 'undefined' && window.innerWidth >= 768, maxColumn: 80 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            mouseWheelZoom: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            bracketPairColorization: { enabled: true },
            renderLineHighlight: 'all',
            automaticLayout: true,
            padding: { top: 10, bottom: 10 },
          }}
        />
      </div>
    </div>
  );
}
