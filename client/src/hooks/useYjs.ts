import { useEffect, useState, useMemo } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { SERVER_WS_URL } from '../utils/constants';
import { UserInfo, UserPresence } from '../types';

export function useYjs(room: string, currentUser: UserInfo) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [collaborators, setCollaborators] = useState<UserPresence[]>([]);

  // Create persistent Y.Doc instance for this component session
  const ydoc = useMemo(() => new Y.Doc(), [room]);

  // Connect to WebSocket server provider
  const provider = useMemo(() => {
    return new WebsocketProvider(SERVER_WS_URL, room, ydoc, {
      connect: true,
    });
  }, [room, ydoc]);

  useEffect(() => {
    // Set current user awareness state (name, color, ID)
    provider.awareness.setLocalStateField('user', currentUser);

    const onStatus = (event: { status: 'connecting' | 'connected' | 'disconnected' }) => {
      setStatus(event.status);
    };

    const updateCollaborators = () => {
      const states = provider.awareness.getStates();
      const users: UserPresence[] = [];

      states.forEach((state, clientId) => {
        if (state.user) {
          users.push({
            clientId,
            user: state.user,
            cursor: state.cursor,
          });
        }
      });

      setCollaborators(users);
    };

    provider.on('status', onStatus);
    provider.awareness.on('change', updateCollaborators);

    // Initial populate
    updateCollaborators();

    return () => {
      provider.off('status', onStatus);
      provider.awareness.off('change', updateCollaborators);
      provider.destroy();
      ydoc.destroy();
    };
  }, [provider, ydoc, currentUser]);

  return {
    ydoc,
    provider,
    status,
    collaborators,
    awareness: provider.awareness,
  };
}
