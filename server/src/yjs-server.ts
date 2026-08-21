import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
// @ts-expect-error y-websocket bin utils lacks official TypeScript type declarations
import * as yWSUtils from 'y-websocket/bin/utils';
import { logger } from './utils/logger.js';

export function setupYjsWebSocketServer(wss: WebSocketServer) {
  wss.on('connection', (conn: WebSocket, req: IncomingMessage) => {
    try {
      // Extract room/document name from query string or URL path (e.g., /ws?room=my-room)
      const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      let docName = url.searchParams.get('room');

      if (!docName) {
        // Fallback: extract from path (e.g. /default or /room-name)
        const pathSegments = url.pathname.split('/').filter(Boolean);
        docName = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : 'default-room';
      }

      logger.info(`New collaborator connected to room: [${docName}] (Active clients: ${wss.clients.size})`);

      // Initialize CRDT document synchronization and awareness tracking for this room
      yWSUtils.setupWSConnection(conn, req, {
        docName,
        gc: true, // Enable garbage collection for memory efficiency
      });

      conn.on('close', () => {
        logger.info(`Collaborator disconnected from room: [${docName}] (Remaining: ${wss.clients.size})`);
      });

      conn.on('error', (err: Error) => {
        logger.error(`WebSocket error in room [${docName}]: ${err.message}`);
      });
    } catch (err) {
      logger.error('Failed to setup Yjs WebSocket connection:', err);
      conn.close();
    }
  });
}
