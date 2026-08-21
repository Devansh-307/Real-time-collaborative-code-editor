/**
 * CodeSync Collaboration Server
 * Standalone Node.js WebSocket server powered by Yjs and y-websocket.
 * Provides CRDT document sync and awareness (live cursors, presence).
 */

const http = require('http');
const WebSocket = require('ws');
const url = require('url');
const { setupWSConnection } = require('y-websocket/bin/utils');

const PORT = parseInt(process.env.PORT || '1234', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Regex for valid room IDs: 3-64 alphanumeric characters, dashes, or underscores
const ROOM_NAME_REGEX = /^[a-zA-Z0-9_-]{3,64}$/;

// Track active connections per room for metrics & structured logging
const roomStats = new Map();

/**
 * HTTP Server for health probes and WebSocket upgrading
 */
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === '/health' || parsedUrl.pathname === '/collaboration/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      activeRooms: roomStats.size,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('CodeSync Yjs Collaboration Server Active');
});

const wss = new WebSocket.Server({ noServer: true });

/**
 * Extract and sanitize room name from URL
 */
function extractRoomName(reqUrl) {
  const parsed = url.parse(reqUrl, true);
  
  // Check query parameter ?room=...
  if (parsed.query && parsed.query.room) {
    return parsed.query.room.toString();
  }

  // Check path: e.g. /collaboration/ABCD-1234 or /ABCD-1234
  const segments = parsed.pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;
  
  // If first segment is 'collaboration', take the next segment if available
  if (segments[0].toLowerCase() === 'collaboration') {
    return segments[1] || 'default';
  }

  return segments[segments.length - 1];
}

server.on('upgrade', (request, socket, head) => {
  const roomName = extractRoomName(request.url);

  if (!roomName || !ROOM_NAME_REGEX.test(roomName)) {
    console.warn(`[AUTH] Rejecting WebSocket connection with invalid room name: "${roomName}" from ${request.socket.remoteAddress}`);
    socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request, roomName);
  });
});

wss.on('connection', (ws, req, roomName) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const currentRoomCount = (roomStats.get(roomName) || 0) + 1;
  roomStats.set(roomName, currentRoomCount);

  console.log(`[CONNECT] Room "${roomName}" - Client connected from ${clientIp}. Total in room: ${currentRoomCount}`);

  // Initialize Yjs WebSocket connection with roomName docName
  // Note: Contents of CRDT documents are never logged to preserve privacy and performance
  setupWSConnection(ws, req, { docName: roomName });

  ws.on('close', (code, reason) => {
    const updatedCount = Math.max(0, (roomStats.get(roomName) || 1) - 1);
    if (updatedCount === 0) {
      roomStats.delete(roomName);
    } else {
      roomStats.set(roomName, updatedCount);
    }
    console.log(`[DISCONNECT] Room "${roomName}" - Client disconnected (code: ${code}). Total in room: ${updatedCount}`);
  });

  ws.on('error', (err) => {
    console.error(`[ERROR] Room "${roomName}" WebSocket error:`, err.message);
  });
});

// Start Server
server.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(` CodeSync Collaboration Server running on ${HOST}:${PORT}`);
  console.log(` Health probe: http://${HOST}:${PORT}/health`);
  console.log(`=======================================================`);
});

// Graceful Shutdown
function handleShutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down collaboration server gracefully...`);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.close(1001, 'Server shutting down');
    }
  });

  server.close(() => {
    console.log('Collaboration server closed successfully.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forced exit after 5s shutdown timeout.');
    process.exit(1);
  }, 5000).unref();
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
