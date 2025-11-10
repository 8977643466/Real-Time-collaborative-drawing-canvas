class SocketHandler {
  constructor(canvasManager) {
    this.canvas = canvasManager;
    this.socket = io();
    
    this.userId = null;
    this.userColor = null;
    this.userName = null;
    
    this.lastPingTime = 0;
    this.latency = 0;
    this.pingInterval = null;
    
    this.onInitCallback = null;
    this.onUserJoinedCallback = null;
    this.onUserLeftCallback = null;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('✅ Connected to server');
      this.startPingMonitoring();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected:', reason);
      this.stopPingMonitoring();
    });

    this.socket.on(EVENTS.INIT, (data) => {
      this.userId = data.userId;
      this.userColor = data.userColor;
      this.userName = data.userName;
      
      console.log(`👤 Initialized as ${this.userName}`);
      console.log(`   Initial operations: ${data.operations.length}`);
      
      this.canvas.redrawFromHistory(data.operations);
      
      if (this.onInitCallback) {
        this.onInitCallback(data);
      }
    });

    this.socket.on(EVENTS.DRAW_START, (operation) => {
      console.log('📥 Remote user started drawing');
    });

    this.socket.on(EVENTS.DRAW_END, (data) => {
      console.log('📥 Remote user finished drawing');
      console.log('🔄 Requesting canvas sync...');
      this.socket.emit(EVENTS.REQUEST_SYNC);
    });

    this.socket.on(EVENTS.CURSOR_MOVE, (data) => {
      this.canvas.cursorRenderer.updateCursor(
        data.userId,
        data.x,
        data.y,
        data.color,
        data.name
      );
    });

    this.socket.on(EVENTS.UNDO_OPERATION, (data) => {
      console.log('↶ Undo operation');
      this.canvas.redrawFromHistory(data.operations);
    });

    this.socket.on(EVENTS.REDO_OPERATION, (data) => {
      console.log('↷ Redo operation');
      this.canvas.drawRemoteStroke(data.operation);
    });

    this.socket.on(EVENTS.CANVAS_CLEARED, () => {
      console.log('🧹 Canvas cleared');
      this.canvas.clearCanvas();
    });

    this.socket.on(EVENTS.USER_JOINED, (user) => {
      console.log(`👋 ${user.name} joined`);
      if (this.onUserJoinedCallback) {
        this.onUserJoinedCallback(user);
      }
    });

    this.socket.on(EVENTS.USER_LEFT, (data) => {
      console.log(`👋 ${data.userName} left`);
      this.canvas.cursorRenderer.removeCursor(data.userId);
      if (this.onUserLeftCallback) {
        this.onUserLeftCallback(data);
      }
    });

    this.socket.on(EVENTS.SYNC_STATE, (data) => {
      console.log(`🔄 Sync received: ${data.operations.length} operations`);
      this.canvas.redrawFromHistory(data.operations);
    });

    this.socket.on(EVENTS.PONG, () => {
      this.latency = Date.now() - this.lastPingTime;
    });
  }

  emitDrawStart(points, color, width, tool, strokeId) {
    console.log('📤 Emitting draw-start');
    console.log(`   StrokeId: ${strokeId}`);
    this.socket.emit(EVENTS.DRAW_START, {
      points,
      color,
      width,
      tool,
      strokeId  // CRITICAL: Send strokeId to server
    });
  }

  emitDrawContinue(points, strokeId) {
    this.socket.emit(EVENTS.DRAW_CONTINUE, {
      points,
      strokeId
    });
  }

  emitDrawEnd(points, strokeId) {
    console.log(`📤 Emitting draw-end`);
    console.log(`   StrokeId: ${strokeId}`);
    console.log(`   Points: ${points.length}`);
    this.socket.emit(EVENTS.DRAW_END, {
      points,
      strokeId
    });
  }

  emitCursorMove(x, y) {
    this.socket.emit(EVENTS.CURSOR_MOVE, { x, y });
  }

  emitUndo() {
    this.socket.emit(EVENTS.UNDO);
  }

  emitRedo() {
    this.socket.emit(EVENTS.REDO);
  }

  emitClear() {
    if (confirm('⚠️ Clear canvas for all users?')) {
      this.socket.emit(EVENTS.CLEAR_CANVAS);
    }
  }

  requestSync() {
    this.socket.emit(EVENTS.REQUEST_SYNC);
  }

  startPingMonitoring() {
    this.pingInterval = setInterval(() => {
      this.lastPingTime = Date.now();
      this.socket.emit(EVENTS.PING);
    }, CONFIG.PING_INTERVAL);
  }

  stopPingMonitoring() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  getLatency() {
    return this.latency;
  }
}
