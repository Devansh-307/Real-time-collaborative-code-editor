import React, { useRef, useEffect } from 'react';
import MonacoEditor, { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { WebsocketProvider } from 'y-websocket';
import { LanguageOption, UserInfo } from '../types';

interface EditorProps {
  ydoc: Y.Doc;
  provider: WebsocketProvider;
  currentLanguage: LanguageOption;
  currentUser: UserInfo;
  onRunCode: () => void;
  onCodeChange?: (code: string) => void;
}

export const Editor: React.FC<EditorProps> = ({
  ydoc,
  provider,
  currentLanguage,
  currentUser,
  onRunCode,
  onCodeChange,
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Retrieve shared Y.Text type for the document
    const ytext = ydoc.getText('monaco');

    // If the CRDT document is newly created and empty, populate with default template
    if (ytext.length === 0 && currentLanguage.defaultCode) {
      ytext.insert(0, currentLanguage.defaultCode);
    }

    const model = editor.getModel();
    if (model) {
      // Create CRDT Monaco Binding for real-time text sync and cursor tracking
      bindingRef.current = new MonacoBinding(
        ytext,
        model,
        new Set([editor]),
        provider.awareness
      );

      // Listen for text changes to notify parent if needed
      model.onDidChangeContent(() => {
        if (onCodeChange) {
          onCodeChange(model.getValue());
        }
      });
    }

    // Add keyboard shortcut Ctrl+Enter or Cmd+Enter to execute code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRunCode();
    });

    // Format Monaco editor layout nicely
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'Fira Code', Consolas, 'Courier New', monospace",
      fontLigatures: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      lineNumbers: 'on',
      renderLineHighlight: 'all',
      automaticLayout: true,
      tabSize: 2,
    });
  };

  // Dynamically inject styles for collaborator cursor tags and colors
  useEffect(() => {
    const styleId = `yjs-user-${currentUser.id}`;
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = `
      .yRemoteSelectionHead {
        border-color: ${currentUser.color} !important;
      }
      .yRemoteSelectionHead::after {
        border-color: ${currentUser.color} !important;
      }
    `;

    return () => {
      styleTag?.remove();
    };
  }, [currentUser]);

  // Clean up Y-Monaco binding on unmount
  useEffect(() => {
    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#1e1e1e]">
      <MonacoEditor
        height="100%"
        theme="vs-dark"
        language={currentLanguage.monacoLanguage}
        onMount={handleEditorDidMount}
        options={{
          padding: { top: 12, bottom: 12 },
        }}
      />
    </div>
  );
};
