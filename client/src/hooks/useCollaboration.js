/**
 * React Hook for CodeSync Real-time Collaboration
 * Synchronizes room status, connected peer awareness, and CRDT file tree.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createCollaborationSession } from '../lib/collaboration';
import { getTemplate, getLanguages } from '../lib/api';

export function useCollaboration({ roomId, user, initialLanguage = 'python' }) {
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'connected' | 'disconnected'
  const [collaborators, setCollaborators] = useState([]);
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);

  const sessionRef = useRef(null);
  const filesMapRef = useRef(null);

  // Initialize Yjs session
  useEffect(() => {
    if (!roomId) return;

    const session = createCollaborationSession(roomId, user);
    sessionRef.current = session;

    const { doc, provider, awareness } = session;
    const filesMap = doc.getMap('files');
    filesMapRef.current = filesMap;

    // 1. Connection status listeners
    const handleStatus = (event) => {
      setConnectionStatus(event.status); // 'connected', 'connecting', 'disconnected'
    };
    provider.on('status', handleStatus);

    // 2. Awareness (peer presence & active file)
    const handleAwarenessChange = () => {
      const states = awareness.getStates();
      const currentClientId = doc.clientID;
      const peers = [];

      states.forEach((state, clientId) => {
        if (state.user) {
          peers.push({
            clientId,
            name: state.user.name || 'Anonymous',
            color: state.user.color || '#38bdf8',
            activeFile: state.user.activeFile || null,
            isSelf: clientId === currentClientId,
          });
        }
      });

      setCollaborators(peers);
    };

    awareness.on('change', handleAwarenessChange);
    handleAwarenessChange();

    // 3. File tree synchronization via Y.Map
    const updateFilesFromCRDT = () => {
      const currentFiles = [];
      filesMap.forEach((val, key) => {
        currentFiles.push({ ...val, id: key });
      });

      // Sort files: entry files first, then alphabetically
      currentFiles.sort((a, b) => {
        if (a.isEntry && !b.isEntry) return -1;
        if (!a.isEntry && b.isEntry) return 1;
        return a.name.localeCompare(b.name);
      });

      setFiles(currentFiles);

      // Auto-select first or entry file if activeFileId is unset or removed
      setActiveFileId((prevActive) => {
        if (currentFiles.length === 0) return null;
        const exists = currentFiles.some((f) => f.id === prevActive);
        if (exists) return prevActive;
        const entry = currentFiles.find((f) => f.isEntry) || currentFiles[0];
        return entry ? entry.id : null;
      });
    };

    filesMap.observe(updateFilesFromCRDT);

    // 4. Initial template population on sync
    const handleSync = (isSynced) => {
      if (isSynced && filesMap.size === 0) {
        // Populate default files for the room template
        getTemplate(initialLanguage)
          .then((templateFiles) => {
            if (filesMap.size === 0) {
              doc.transact(() => {
                let idx = 1;
                for (const [filename, content] of Object.entries(templateFiles)) {
                  const fileId = `file-${idx}`;
                  const yText = doc.getText(`content:${fileId}`);
                  if (yText.length === 0) {
                    yText.insert(0, content);
                  }

                  const ext = filename.split('.').pop();
                  let lang = initialLanguage;
                  if (ext === 'py') lang = 'python';
                  else if (ext === 'js') lang = 'javascript';
                  else if (ext === 'cpp') lang = 'cpp';
                  else if (ext === 'java') lang = 'java';
                  else if (ext === 'json') lang = 'json';
                  else if (ext === 'html') lang = 'html';

                  filesMap.set(fileId, {
                    name: filename,
                    path: `/${filename}`,
                    language: lang,
                    isEntry: idx === 1,
                  });
                  idx++;
                }
              });
            }
          })
          .catch((err) => console.error('Failed to load initial template:', err));
      } else {
        updateFilesFromCRDT();
      }
    };

    provider.on('sync', handleSync);
    if (provider.synced) {
      handleSync(true);
    }

    return () => {
      provider.off('status', handleStatus);
      provider.off('sync', handleSync);
      awareness.off('change', handleAwarenessChange);
      filesMap.unobserve(updateFilesFromCRDT);
      session.destroy();
      sessionRef.current = null;
    };
  }, [roomId, initialLanguage]);

  // Update awareness whenever active file changes
  useEffect(() => {
    if (sessionRef.current && sessionRef.current.awareness) {
      sessionRef.current.awareness.setLocalStateField('user', {
        ...user,
        activeFile: activeFileId,
      });
    }
  }, [activeFileId, user]);

  // Add new file to project
  const addFile = useCallback((filename, initialContent = '', language = 'python') => {
    if (!sessionRef.current || !filesMapRef.current) return null;
    const { doc } = sessionRef.current;
    const filesMap = filesMapRef.current;

    if (filesMap.size >= 30) {
      throw new Error('Maximum project file limit (30 files) reached.');
    }

    const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    doc.transact(() => {
      const yText = doc.getText(`content:${fileId}`);
      if (initialContent) {
        yText.insert(0, initialContent);
      }

      filesMap.set(fileId, {
        name: filename,
        path: `/${filename}`,
        language,
        isEntry: filesMap.size === 0,
      });
    });

    setActiveFileId(fileId);
    return fileId;
  }, []);

  // Rename an existing file
  const renameFile = useCallback((fileId, newName) => {
    if (!sessionRef.current || !filesMapRef.current) return;
    const filesMap = filesMapRef.current;
    const file = filesMap.get(fileId);
    if (file) {
      const ext = newName.split('.').pop();
      let lang = file.language;
      if (ext === 'py') lang = 'python';
      else if (ext === 'js') lang = 'javascript';
      else if (ext === 'cpp') lang = 'cpp';
      else if (ext === 'java') lang = 'java';
      else if (ext === 'json') lang = 'json';
      else if (ext === 'html') lang = 'html';

      filesMap.set(fileId, {
        ...file,
        name: newName,
        path: `/${newName}`,
        language: lang,
      });
    }
  }, []);

  // Delete a file
  const deleteFile = useCallback((fileId) => {
    if (!sessionRef.current || !filesMapRef.current) return;
    const filesMap = filesMapRef.current;
    const { doc } = sessionRef.current;

    if (filesMap.size <= 1) {
      throw new Error('Cannot delete the only remaining file in the project.');
    }

    doc.transact(() => {
      filesMap.delete(fileId);
      // Clean up text CRDT
      const yText = doc.getText(`content:${fileId}`);
      yText.delete(0, yText.length);
    });
  }, []);

  // Retrieve Y.Text for editor binding
  const getYText = useCallback((fileId) => {
    if (!sessionRef.current || !fileId) return null;
    return sessionRef.current.doc.getText(`content:${fileId}`);
  }, []);

  // Replace entire content of a file (e.g. template reset)
  const replaceFileContent = useCallback((fileId, newContent) => {
    if (!sessionRef.current || !fileId) return;
    const { doc } = sessionRef.current;
    const yText = doc.getText(`content:${fileId}`);
    doc.transact(() => {
      yText.delete(0, yText.length);
      yText.insert(0, newContent);
    });
  }, []);

  // Retrieve all current files with their latest content
  const getAllFilesContent = useCallback(() => {
    if (!sessionRef.current || !filesMapRef.current) return [];
    const { doc } = sessionRef.current;
    const filesMap = filesMapRef.current;

    const result = [];
    filesMap.forEach((meta, id) => {
      const yText = doc.getText(`content:${id}`);
      result.push({
        name: meta.name,
        content: yText.toString(),
        language: meta.language,
        isEntry: meta.isEntry,
      });
    });
    return result;
  }, []);

  const activeFile = files.find((f) => f.id === activeFileId) || files[0] || null;

  return {
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
    doc: sessionRef.current?.doc,
    provider: sessionRef.current?.provider,
    awareness: sessionRef.current?.awareness,
  };
}
