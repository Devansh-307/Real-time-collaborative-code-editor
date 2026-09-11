import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import FileExplorer from '../components/FileExplorer';
import Editor from '../components/Editor';
import OutputPanel from '../components/OutputPanel';
import Collaborators from '../components/Collaborators';
import ShareModal from '../components/ShareModal';
import TemplatesModal from '../components/TemplatesModal';
import { useCollaboration } from '../hooks/useCollaboration';
import { getLanguages, executeCode } from '../lib/api';

export default function EditorPage({
  roomId,
  user,
  theme,
  onToggleTheme,
  onLeaveRoom,
  initialLanguage = 'python',
}) {
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);

  // Panel display toggles
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [isOutputOpen, setIsOutputOpen] = useState(true);
  const [showCollabPanel, setShowCollabPanel] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [outputTab, setOutputTab] = useState('console'); // 'console' | 'stdin' | 'preview' | 'json'

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [executionOutput, setExecutionOutput] = useState({});
  const [stdinText, setStdinText] = useState('');

  // Collaboration CRDT hook
  const {
    connectionStatus,
    collaborators,
    files,
    activeFile,
    activeFileId,
    setActiveFileId,
    addFile,
    renameFile,
    deleteFile,
    replaceFileContent,
    getYText,
    getAllFilesContent,
    awareness,
  } = useCollaboration({
    roomId,
    user,
    initialLanguage: selectedLanguage,
  });

  // Fetch available languages
  useEffect(() => {
    getLanguages()
      .then((data) => {
        if (Array.isArray(data)) setLanguages(data);
      })
      .catch((err) => console.error('Failed to fetch languages:', err));
  }, []);

  // Update selected language when active file changes
  useEffect(() => {
    if (activeFile && activeFile.language) {
      setSelectedLanguage(activeFile.language);
    }
  }, [activeFile?.id, activeFile?.language]);

  // Execute current project code
  const handleRunCode = useCallback(async () => {
    if (isRunning) return;

    // Gather all source files
    const allFiles = getAllFilesContent();
    if (allFiles.length === 0) return;

    // If active file is HTML or JSON, switch directly to preview mode
    if (activeFile?.name?.endsWith('.html')) {
      setOutputTab('preview');
      setIsOutputOpen(true);
      return;
    }
    if (activeFile?.name?.endsWith('.json')) {
      setOutputTab('json');
      setIsOutputOpen(true);
      return;
    }

    setIsRunning(true);
    setIsOutputOpen(true);
    setOutputTab('console');
    setExecutionOutput({ status: 'running' });

    // Determine entry file
    const entryFile = allFiles.find((f) => f.isEntry)?.name || activeFile?.name || allFiles[0].name;

    try {
      const response = await executeCode({
        language: selectedLanguage,
        files: allFiles.map((f) => ({ name: f.name, content: f.content })),
        entryFile,
        stdin: stdinText,
        timeoutSeconds: 5,
      });

      setExecutionOutput(response);
    } catch (err) {
      setExecutionOutput({
        stdout: '',
        stderr: `Execution failed: ${err.message}`,
        exit_code: 1,
        elapsed_ms: 0,
        timed_out: false,
        status: 'error',
      });
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, getAllFilesContent, activeFile, selectedLanguage, stdinText]);

  // Handle global shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Enter or Cmd+Enter -> Run Code
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode();
      }
      // Ctrl+B or Cmd+B -> Toggle Explorer
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setIsExplorerOpen((prev) => !prev);
      }
      // Ctrl+J or Cmd+J -> Toggle Output Panel
      if ((e.ctrlKey || e.metaKey) && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        setIsOutputOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRunCode]);

  const allFilesList = getAllFilesContent();
  const hasHtmlFile = files.some((f) => f.name.endsWith('.html'));

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Top Navbar */}
      <Navbar
        roomId={roomId}
        connectionStatus={connectionStatus}
        collaborators={collaborators}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={setSelectedLanguage}
        languages={languages}
        onRun={handleRunCode}
        isRunning={isRunning}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onLeaveRoom={onLeaveRoom}
        isExplorerOpen={isExplorerOpen}
        onToggleExplorer={() => setIsExplorerOpen(!isExplorerOpen)}
        isOutputOpen={isOutputOpen}
        onToggleOutput={() => setIsOutputOpen(!isOutputOpen)}
        isPreviewOpen={outputTab === 'preview' && isOutputOpen}
        onTogglePreview={() => {
          if (outputTab === 'preview' && isOutputOpen) {
            setIsOutputOpen(false);
          } else {
            setOutputTab('preview');
            setIsOutputOpen(true);
          }
        }}
        showPreviewToggle={hasHtmlFile}
        showCollabPanel={showCollabPanel}
        onToggleCollabPanel={() => setShowCollabPanel(!showCollabPanel)}
        onOpenShare={() => setIsShareModalOpen(true)}
      />

      {/* Main IDE Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: File Explorer Panel (Slide-over drawer on mobile, static sidebar on desktop) */}
        {isExplorerOpen && (
          <>
            {/* Mobile Backdrop */}
            <div
              onClick={() => setIsExplorerOpen(false)}
              className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs"
            />
            <div className="fixed inset-y-14 left-0 z-40 md:static md:inset-auto md:z-auto h-[calc(100vh-3.5rem)] shadow-2xl md:shadow-none animate-in slide-in-from-left duration-150">
              <FileExplorer
                files={files}
                activeFileId={activeFileId}
                onSelectFile={(id) => {
                  setActiveFileId(id);
                  if (window.innerWidth < 768) {
                    setIsExplorerOpen(false);
                  }
                }}
                onAddFile={(name) => addFile(name, '', selectedLanguage)}
                onRenameFile={renameFile}
                onDeleteFile={deleteFile}
                collaborators={collaborators}
              />
            </div>
          </>
        )}

        {/* Center: Monaco Code Editor + Output Panel */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
          <div className="flex-1 relative overflow-hidden">
            <Editor
              activeFile={activeFile}
              getYText={getYText}
              awareness={awareness}
              theme={theme}
              onRun={handleRunCode}
              onToggleExplorer={() => setIsExplorerOpen(!isExplorerOpen)}
              onToggleOutput={() => setIsOutputOpen(!isOutputOpen)}
              onOpenTemplates={() => setIsTemplatesModalOpen(true)}
            />
          </div>

          {/* Bottom Output Panel */}
          {isOutputOpen && (
            <OutputPanel
              output={executionOutput}
              isRunning={isRunning}
              onClear={() => setExecutionOutput({})}
              stdin={stdinText}
              onStdinChange={setStdinText}
              activeFile={activeFile}
              allFiles={allFilesList}
              onClose={() => setIsOutputOpen(false)}
              activeTab={outputTab}
              onTabChange={setOutputTab}
            />
          )}
        </div>

        {/* Right: Collaborators & Info Panel (Slide-over drawer on mobile) */}
        {showCollabPanel && (
          <>
            <div
              onClick={() => setShowCollabPanel(false)}
              className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs"
            />
            <div className="fixed inset-y-14 right-0 z-40 md:static md:inset-auto md:z-auto h-[calc(100vh-3.5rem)] shadow-2xl md:shadow-none animate-in slide-in-from-right duration-150">
              <Collaborators
                collaborators={collaborators}
                files={files}
                roomId={roomId}
                onClose={() => setShowCollabPanel(false)}
                onOpenShare={() => setIsShareModalOpen(true)}
              />
            </div>
          </>
        )}
      </div>

      {/* Interactive Share Modal Popup */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        roomId={roomId}
      />

      {/* Code Templates & Presets Modal */}
      <TemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        language={selectedLanguage}
        onSelectTemplate={(code) => {
          if (activeFile) {
            replaceFileContent(activeFile.id, code);
          }
        }}
      />
    </div>
  );
}
