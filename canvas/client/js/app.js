window.addEventListener('DOMContentLoaded', () => {
  console.log('🎨 Initializing Collaborative Canvas...');
  
  const canvasManager = new CanvasManager('canvasContainer');
  const socketHandler = new SocketHandler(canvasManager);
  
  let toolbarController;
  let userListManager;
  
  let fpsCounter = 0;
  let lastFpsUpdate = Date.now();
  const fpsDisplay = document.getElementById('fpsCounter');
  const latencyDisplay = document.getElementById('latencyCounter');
  
  let isDrawing = false;
  let lastCursorEmit = 0;
  
  socketHandler.onInitCallback = (data) => {
    toolbarController = new ToolbarController(canvasManager, socketHandler);
    userListManager = new UserListManager(data.userId);
    userListManager.initializeUsers(data.users);
    
    document.getElementById('currentUserColor').style.backgroundColor = data.userColor;
    document.getElementById('currentUserName').textContent = data.userName;
    
    console.log('✅ Ready!');
  };
  
  socketHandler.onUserJoinedCallback = (user) => {
    if (userListManager) userListManager.addUser(user);
  };
  
  socketHandler.onUserLeftCallback = (data) => {
    if (userListManager) userListManager.removeUser(data.userId);
  };
  
  canvasManager.activeLayer.addEventListener('mousedown', (e) => {
  const coords = canvasManager.getCanvasCoordinates(e);
  isDrawing = true;
  
  const strokeData = canvasManager.startStroke(coords.x, coords.y);
  
  // CRITICAL: Pass the strokeId to the server
  socketHandler.emitDrawStart(
    strokeData.points,
    canvasManager.currentColor,
    canvasManager.currentWidth,
    canvasManager.currentTool,
    strokeData.strokeId  // ADD THIS
  );
});

  canvasManager.activeLayer.addEventListener('mousemove', (e) => {
    const coords = canvasManager.getCanvasCoordinates(e);
    const now = Date.now();
    
    if (now - lastCursorEmit > CONFIG.CURSOR_THROTTLE) {
      socketHandler.emitCursorMove(coords.x, coords.y);
      lastCursorEmit = now;
    }
    
    if (isDrawing) {
      canvasManager.continueStroke(coords.x, coords.y);
      
      if (now - canvasManager.lastBatchSend > CONFIG.DRAW_BATCH_INTERVAL) {
        const bufferedPoints = canvasManager.getBufferedPoints();
        if (bufferedPoints.length > 0) {
          socketHandler.emitDrawContinue(
            canvasManager.currentStroke,
            canvasManager.currentStrokeId
          );
        }
        canvasManager.lastBatchSend = now;
      }
    }
  });
  
  canvasManager.activeLayer.addEventListener('mouseup', () => {
    if (isDrawing) {
      const strokeData = canvasManager.endStroke();
      if (strokeData) {
        socketHandler.emitDrawEnd(strokeData.points, strokeData.strokeId);
      }
    }
    isDrawing = false;
  });
  
  canvasManager.activeLayer.addEventListener('mouseleave', () => {
    if (isDrawing) {
      const strokeData = canvasManager.endStroke();
      if (strokeData) {
        socketHandler.emitDrawEnd(strokeData.points, strokeData.strokeId);
      }
    }
    isDrawing = false;
  });
  
  canvasManager.activeLayer.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const coords = canvasManager.getTouchCoordinates(e);
  isDrawing = true;
  
  const strokeData = canvasManager.startStroke(coords.x, coords.y);
  
  // CRITICAL: Pass the strokeId
  socketHandler.emitDrawStart(
    strokeData.points,
    canvasManager.currentColor,
    canvasManager.currentWidth,
    canvasManager.currentTool,
    strokeData.strokeId  // ADD THIS
  );
}, { passive: false });

  
  canvasManager.activeLayer.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const coords = canvasManager.getTouchCoordinates(e);
    canvasManager.continueStroke(coords.x, coords.y);
    
    const now = Date.now();
    if (now - canvasManager.lastBatchSend > CONFIG.DRAW_BATCH_INTERVAL) {
      socketHandler.emitDrawContinue(
        canvasManager.currentStroke,
        canvasManager.currentStrokeId
      );
      canvasManager.lastBatchSend = now;
    }
  }, { passive: false });
  
  canvasManager.activeLayer.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (isDrawing) {
      const strokeData = canvasManager.endStroke();
      if (strokeData) {
        socketHandler.emitDrawEnd(strokeData.points, strokeData.strokeId);
      }
    }
    isDrawing = false;
  }, { passive: false });
  
  function updatePerformanceMetrics() {
    fpsCounter++;
    const now = Date.now();
    
    if (now - lastFpsUpdate >= CONFIG.FPS_UPDATE_INTERVAL) {
      const fps = Math.round((fpsCounter * 1000) / (now - lastFpsUpdate));
      fpsDisplay.textContent = fps;
      fpsCounter = 0;
      lastFpsUpdate = now;
    }
    
    latencyDisplay.textContent = socketHandler.getLatency();
    requestAnimationFrame(updatePerformanceMetrics);
  }
  updatePerformanceMetrics();
  
  console.log('🎨 Canvas ready!');
});
