const CONFIG = {
  DEFAULT_COLOR: '#000000',
  DEFAULT_BRUSH_SIZE: 3,
  MIN_BRUSH_SIZE: 1,
  MAX_BRUSH_SIZE: 50,
  ERASER_MULTIPLIER: 2,
  
  DRAW_BATCH_INTERVAL: 16,
  CURSOR_THROTTLE: 50,
  FPS_UPDATE_INTERVAL: 1000,
  
  PING_INTERVAL: 1000,
  RECONNECT_DELAY: 2000,
  
  GRID_SIZE: 20,
  GRID_COLOR: '#f0f0f0',
  CANVAS_BG: '#ffffff',
  
  CURSOR_DOT_RADIUS: 5,
  CURSOR_RING_RADIUS: 10,
  CURSOR_TIMEOUT: 2000
};

const TOOLS = {
  BRUSH: 'brush',
  ERASER: 'eraser'
};

const EVENTS = {
  DRAW_START: 'draw-start',
  DRAW_CONTINUE: 'draw-continue',
  DRAW_END: 'draw-end',
  CURSOR_MOVE: 'cursor-move',
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  UNDO: 'undo',
  REDO: 'redo',
  CLEAR_CANVAS: 'clear-canvas',
  INIT: 'init',
  SYNC_STATE: 'sync-state',
  UNDO_OPERATION: 'undo-operation',
  REDO_OPERATION: 'redo-operation',
  CANVAS_CLEARED: 'canvas-cleared',
  PING: 'ping',
  PONG: 'pong',
  REQUEST_SYNC: 'request-sync'
};
