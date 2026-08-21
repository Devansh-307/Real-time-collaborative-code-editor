import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import { config } from './config.js';
import { executeRouter } from './routes/execute.js';
import { setupYjsWebSocketServer } from './yjs-server.js';
import { logger } from './utils/logger.js';

const app = express();

// Middleware
app.use(
  cors({
    origin: '*', // Allow all origins for dev/docker flexibility
    methods: ['GET', 'POST', 'OPTIONS'],
  })
);
app.use(express.json({ limit: '5mb' }));

// API Routes
app.use('/api', executeRouter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    runnerImage: config.runnerImage,
  });
});

// Create unified HTTP server
const server = http.createServer(app);

// Create WebSocket server attached to HTTP server for Yjs sync
const wss = new WebSocketServer({ server });
setupYjsWebSocketServer(wss);

// Start server
server.listen(config.port, () => {
  logger.info(`===================================================`);
  logger.info(`  Collaborative Code Editor Server Started!       `);
  logger.info(`  HTTP API:        http://localhost:${config.port}     `);
  logger.info(`  WebSocket Sync:  ws://localhost:${config.port}       `);
  logger.info(`  Runner Image:    ${config.runnerImage}              `);
  logger.info(`===================================================`);
});
