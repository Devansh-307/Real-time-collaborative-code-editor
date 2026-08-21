/**
 * CodeSync Collaboration Utilities
 * Manages Yjs CRDT documents, WebSocket provider connections, and awareness tracking.
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

function getCollabWsUrl() {
  if (typeof window !== 'undefined' && window.location) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/collaboration`;
  }
  return import.meta.env.VITE_COLLAB_WS_URL || 'ws://localhost:8080/collaboration';
}

const COLLAB_WS_URL = getCollabWsUrl();

/**
 * Initialize a Yjs collaborative session for a room
 */
export function createCollaborationSession(roomId, user) {
  const doc = new Y.Doc();

  // Connect to the collaboration server
  const provider = new WebsocketProvider(COLLAB_WS_URL, roomId, doc, {
    connect: true,
  });

  const awareness = provider.awareness;

  // Broadcast initial user state
  if (user) {
    awareness.setLocalStateField('user', {
      name: user.name,
      color: user.color,
      activeFile: user.activeFile || null,
      joinedAt: Date.now(),
    });
  }

  // Inject dynamic CSS rules for remote cursor colors
  const styleEl = document.createElement('style');
  styleEl.setAttribute('id', `yjs-styles-${roomId}`);
  document.head.appendChild(styleEl);

  const updateCursorStyles = () => {
    const states = awareness.getStates();
    let cssRules = '';

    states.forEach((state, clientId) => {
      if (state.user && state.user.color) {
        const color = state.user.color;
        const name = state.user.name || 'Anonymous';
        
        cssRules += `
          .yRemoteSelection-${clientId} {
            background-color: ${color}40 !important;
          }
          .yRemoteSelectionHead-${clientId} {
            border-color: ${color} !important;
          }
          .yRemoteSelectionHead-${clientId}::after {
            border-color: ${color} !important;
            background-color: ${color} !important;
          }
        `;
      }
    });

    styleEl.innerHTML = cssRules;
  };

  awareness.on('change', updateCursorStyles);

  return {
    doc,
    provider,
    awareness,
    destroy: () => {
      awareness.off('change', updateCursorStyles);
      provider.destroy();
      doc.destroy();
      if (styleEl && styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
    },
  };
}
