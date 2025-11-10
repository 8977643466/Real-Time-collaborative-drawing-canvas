const express = require('express');
const http = require('http');
const path = require('path');
const { initializeSocket } = require('./config/socketConfig');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);

app.use(express.static(path.join(__dirname, '../client')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const io = initializeSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`🚀 Server is running on http://localhost:${PORT}`);
  logger.info(`📁 Serving static files from: ${path.join(__dirname, '../client')}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, closing server...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
