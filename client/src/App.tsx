import { useState, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { Editor } from './components/Editor';
import { OutputPanel } from './components/OutputPanel';
import { useYjs } from './hooks/useYjs';
import { useExecution } from './hooks/useExecution';
import { getOrCreateLocalUser } from './utils/presence';
import { DEFAULT_LANGUAGES } from './utils/constants';
import { LanguageOption } from './types';

export function App() {
  // Read or generate room name from URL query parameter ?room=...
  const room = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    let r = params.get('room');
    if (!r) {
      r = 'collab-' + Math.random().toString(36).substring(2, 7);
      const newUrl = `${window.location.pathname}?room=${r}`;
      window.history.replaceState(null, '', newUrl);
    }
    return r;
  }, []);

  // Initialize or read stored local user profile
  const currentUser = useMemo(() => getOrCreateLocalUser(), []);

  // Selected language state
  const [currentLanguage, setCurrentLanguage] = useState<LanguageOption>(DEFAULT_LANGUAGES[0]);

  // Code state
  const [code, setCode] = useState<string>('');

  // Stdin state
  const [stdin, setStdin] = useState<string>('');

  // Yjs CRDT hook
  const { ydoc, provider, status: connectionStatus, collaborators } = useYjs(room, currentUser);

  // Execution hook
  const { status: executionStatus, result, executeCode, clearOutput } = useExecution();

  // Trigger code execution
  const handleRunCode = useCallback(() => {
    const ytext = ydoc.getText('monaco').toString();
    const codeToRun = ytext || code || currentLanguage.defaultCode;
    executeCode(currentLanguage.id, codeToRun, stdin);
  }, [ydoc, code, currentLanguage, stdin, executeCode]);

  // Switch language and insert boilerplate if document is empty
  const handleSelectLanguage = (lang: LanguageOption) => {
    setCurrentLanguage(lang);
    const ytext = ydoc.getText('monaco');
    if (ytext.length === 0) {
      ytext.insert(0, lang.defaultCode);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0e1117] text-slate-100 overflow-hidden">
      {/* Top Navbar */}
      <Header
        room={room}
        connectionStatus={connectionStatus}
        collaborators={collaborators}
        currentUser={currentUser}
        currentLanguage={currentLanguage}
        onSelectLanguage={handleSelectLanguage}
        onRunCode={handleRunCode}
        executionStatus={executionStatus}
      />

      {/* Main Workspace Area (Split between Editor and Output Terminal) */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Monaco Editor Pane */}
        <div className="h-full md:col-span-7 lg:col-span-8 flex flex-col relative">
          <Editor
            ydoc={ydoc}
            provider={provider}
            currentLanguage={currentLanguage}
            currentUser={currentUser}
            onRunCode={handleRunCode}
            onCodeChange={setCode}
          />
        </div>

        {/* Sandboxed Execution Console Pane */}
        <div className="h-full md:col-span-5 lg:col-span-4 flex flex-col">
          <OutputPanel
            status={executionStatus}
            result={result}
            stdin={stdin}
            onStdinChange={setStdin}
            onClear={clearOutput}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
