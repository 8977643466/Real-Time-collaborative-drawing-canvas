class CanvasManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    
    this.bgLayer = document.getElementById('backgroundLayer');
    this.drawingLayer = document.getElementById('drawingLayer');
    this.activeLayer = document.getElementById('activeLayer');
    this.cursorLayer = document.getElementById('cursorLayer');
    
    this.bgCtx = this.bgLayer.getContext('2d');
    this.drawingCtx = this.drawingLayer.getContext('2d');
    this.activeCtx = this.activeLayer.getContext('2d');
    
    this.bgEngine = new DrawingEngine(this.bgCtx);
    this.drawingEngine = new DrawingEngine(this.drawingCtx);
    this.activeEngine = new DrawingEngine(this.activeCtx);
    
    this.cursorRenderer = new CursorRenderer(this.cursorLayer);
    
    this.isDrawing = false;
    this.currentStroke = [];
    this.currentStrokeId = null;
    this.pointBuffer = [];
    this.lastBatchSend = 0;
    
    this.currentTool = TOOLS.BRUSH;
    this.currentColor = CONFIG.DEFAULT_COLOR;
    this.currentWidth = CONFIG.DEFAULT_BRUSH_SIZE;
    
    this.initialize();
  }

  initialize() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.drawBackground();
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    [this.bgLayer, this.drawingLayer, this.activeLayer, this.cursorLayer].forEach(canvas => {
      canvas.width = width;
      canvas.height = height;
    });
    
    this.drawBackground();
  }

  drawBackground() {
    const ctx = this.bgCtx;
    const width = this.bgLayer.width;
    const height = this.bgLayer.height;
    
    ctx.fillStyle = CONFIG.CANVAS_BG;
    ctx.fillRect(0, 0, width, height);
    
    ctx.strokeStyle = CONFIG.GRID_COLOR;
    ctx.lineWidth = 1;
    
    for (let x = 0; x < width; x += CONFIG.GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y < height; y += CONFIG.GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  startStroke(x, y) {
    this.isDrawing = true;
    this.currentStroke = [{ x, y }];
    this.currentStrokeId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.pointBuffer = [{ x, y }];
    
    return {
      points: this.currentStroke,
      strokeId: this.currentStrokeId
    };
  }

  continueStroke(x, y) {
    if (!this.isDrawing) return null;
    
    const prevPoint = this.currentStroke[this.currentStroke.length - 1];
    const newPoint = { x, y };
    
    this.currentStroke.push(newPoint);
    this.pointBuffer.push(newPoint);
    
    const isEraser = (this.currentTool === TOOLS.ERASER);
    
    this.activeEngine.drawSegment(
      prevPoint,
      newPoint,
      this.currentColor,
      this.currentWidth,
      isEraser
    );
    
    return this.currentStroke;
  }

  endStroke() {
    if (!this.isDrawing) return null;
    
    this.isDrawing = false;
    
    this.drawingEngine.drawStroke(
      this.currentStroke,
      this.currentColor,
      this.currentWidth,
      this.currentTool
    );
    
    this.activeEngine.clear();
    
    const strokeData = {
      points: this.currentStroke,
      strokeId: this.currentStrokeId
    };
    
    this.currentStroke = [];
    this.pointBuffer = [];
    this.currentStrokeId = null;
    
    return strokeData;
  }

  getBufferedPoints() {
    const points = [...this.pointBuffer];
    this.pointBuffer = [];
    return points;
  }

  drawRemoteStroke(operation) {
    this.drawingEngine.drawStroke(
      operation.points,
      operation.color,
      operation.width,
      operation.tool
    );
  }

  redrawFromHistory(operations) {
    this.drawingEngine.clear();
    
    operations.forEach(op => {
      if (op.type === 'stroke' && op.points) {
        this.drawingEngine.drawStroke(
          op.points,
          op.color,
          op.width,
          op.tool
        );
      }
    });
  }

  clearCanvas() {
    this.drawingEngine.clear();
    this.activeEngine.clear();
  }

  setTool(tool) {
    this.currentTool = tool;
  }

  setColor(color) {
    this.currentColor = color;
  }

  setWidth(width) {
    this.currentWidth = width;
  }

  getCanvasCoordinates(event) {
    const rect = this.activeLayer.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  getTouchCoordinates(event) {
    const rect = this.activeLayer.getBoundingClientRect();
    const touch = event.touches[0];
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }
}
