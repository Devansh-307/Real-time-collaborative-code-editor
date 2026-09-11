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
            position: absolute !important;
            border-left: 2px solid ${color} !important;
            height: 100% !important;
            box-sizing: border-box !important;
            z-index: 10 !important;
          }
          .yRemoteSelectionHead-${clientId}::after {
            position: absolute !important;
            content: '${name}' !important;
            top: -1.5em !important;
            left: -2px !important;
            font-size: 10px !important;
            line-height: 1 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            font-weight: 600 !important;
            color: #ffffff !important;
            background-color: ${color} !important;
            padding: 2px 5px !important;
            border-radius: 3px !important;
            white-space: nowrap !important;
            pointer-events: none !important;
            z-index: 100 !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
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
