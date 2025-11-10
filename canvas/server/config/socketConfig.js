const socketIO = require('socket.io');
const RoomManager = require('../managers/RoomManager');
const { generateUserColor, generateUsername } = require('../utils/helpers');
const logger = require('../utils/logger');

const roomManager = new RoomManager();

function initializeSocket(server) {
  const io = socketIO(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    logger.info(`New connection: ${socket.id}`);
    
    let currentRoom = 'default';
    let userData = {
      id: socket.id,
      color: generateUserColor(),
      name: generateUsername(),
      joinedAt: Date.now()
    };

    socket.join(currentRoom);
    const room = roomManager.getOrCreateRoom(currentRoom);
    room.addUser(userData);

    socket.emit('init', {
      userId: userData.id,
      userColor: userData.color,
      userName: userData.name,
      operations: room.drawingState.getCurrentState(),
      users: room.getAllUsers()
    });

    socket.to(currentRoom).emit('user-joined', userData);
    logger.info(`User ${userData.name} joined room ${currentRoom}`);

    // FIXED: Store stroke ID mapping
    const strokeIdMap = new Map(); // clientStrokeId -> serverOperationId

    socket.on('draw-start', (data) => {
      logger.info(`📝 Draw-start from ${userData.name}`);
      logger.info(`   Client StrokeId: ${data.strokeId}`);
      logger.info(`   Tool: ${data.tool}, Points: ${data.points?.length}`);
      
      try {
        // Create operation with client's stroke ID
        const operation = {
          type: 'stroke',
          id: data.strokeId || `${socket.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: socket.id,
          userName: userData.name,
          userColor: userData.color,
          points: data.points || [],
          color: data.color,
          width: data.width,
          tool: data.tool || 'brush',
          timestamp: Date.now()
        };

        // Store the mapping
        if (data.strokeId) {
          strokeIdMap.set(data.strokeId, operation.id);
        }

        room.drawingState.addOperation(operation);
        socket.to(currentRoom).emit('draw-start', operation);
        
        logger.info(`   Server OperationId: ${operation.id}`);
        logger.info(`   ✅ Broadcasted to ${room.getUserCount() - 1} users`);
      } catch (error) {
        logger.error('Error handling draw-start:', error);
      }
    });

    socket.on('draw-continue', (data) => {
      socket.to(currentRoom).emit('draw-continue', {
        userId: socket.id,
        points: data.points,
        strokeId: data.strokeId
      });
    });

    socket.on('draw-end', (data) => {
      logger.info(`✅ Draw-end from ${userData.name}`);
      logger.info(`   Client StrokeId: ${data.strokeId}`);
      logger.info(`   Points received: ${data.points?.length}`);
      
      try {
        // Get the server operation ID from the mapping
        const serverOpId = strokeIdMap.get(data.strokeId) || data.strokeId;
        logger.info(`   Server OperationId: ${serverOpId}`);
        
        const updated = room.drawingState.updateStroke(serverOpId, data.points);
        
        if (updated) {
          logger.info(`   ✅ Updated with ${updated.points.length} points`);
        } else {
          logger.warn(`   ⚠️ Failed to find stroke with ID: ${serverOpId}`);
          logger.warn(`   Available operations: ${room.drawingState.operations.map(op => op.id).join(', ')}`);
        }
        
        // Clean up the mapping
        strokeIdMap.delete(data.strokeId);
        
        socket.to(currentRoom).emit('draw-end', {
          userId: socket.id,
          strokeId: data.strokeId,
          points: data.points
        });
        
        logger.info(`   📤 Broadcasted to room`);
      } catch (error) {
        logger.error('Error handling draw-end:', error);
      }
    });

    socket.on('cursor-move', (data) => {
      socket.to(currentRoom).emit('cursor-move', {
        userId: socket.id,
        x: data.x,
        y: data.y,
        color: userData.color,
        name: userData.name
      });
    });

    socket.on('undo', () => {
      logger.info(`↶ Undo by ${userData.name}`);
      const undoneOp = room.drawingState.undo();
      if (undoneOp) {
        io.to(currentRoom).emit('undo-operation', {
          operationId: undoneOp.id,
          currentIndex: room.drawingState.currentIndex,
          operations: room.drawingState.getCurrentState()
        });
      }
    });

    socket.on('redo', () => {
      logger.info(`↷ Redo by ${userData.name}`);
      const redoneOp = room.drawingState.redo();
      if (redoneOp) {
        io.to(currentRoom).emit('redo-operation', {
          operation: redoneOp,
          currentIndex: room.drawingState.currentIndex
        });
      }
    });

    socket.on('clear-canvas', () => {
      logger.info(`🧹 Canvas cleared by ${userData.name}`);
      room.drawingState.clear();
      io.to(currentRoom).emit('canvas-cleared');
    });

    socket.on('request-sync', () => {
      logger.info(`🔄 Sync requested by ${userData.name}`);
      socket.emit('sync-state', {
        operations: room.drawingState.getCurrentState(),
        users: room.getAllUsers()
      });
    });

    socket.on('ping', () => {
      socket.emit('pong');
    });

    socket.on('disconnect', (reason) => {
      logger.info(`User ${userData.name} disconnected: ${reason}`);
      room.removeUser(socket.id);
      strokeIdMap.clear();
      socket.to(currentRoom).emit('user-left', {
        userId: socket.id,
        userName: userData.name
      });

      setTimeout(() => {
        if (room.getUserCount() === 0) {
          roomManager.deleteRoom(currentRoom);
          logger.info(`Room ${currentRoom} deleted`);
        }
      }, 5000);
    });
  });

  return io;
}

module.exports = { initializeSocket };
