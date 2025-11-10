class DrawingEngine {
  constructor(ctx) {
    this.ctx = ctx;
  }

  drawSegment(p1, p2, color, width, isEraser = false) {
    if (isEraser) {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.strokeStyle = 'rgba(0,0,0,1)';
      this.ctx.lineWidth = width * CONFIG.ERASER_MULTIPLIER;
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = width;
    }
    
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    this.ctx.beginPath();
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.lineTo(p2.x, p2.y);
    this.ctx.stroke();
    
    this.ctx.globalCompositeOperation = 'source-over';
  }

  drawStroke(points, color, width, tool = 'brush') {
    if (!points || points.length === 0) return;
    
    const isEraser = (tool === 'eraser' || tool === TOOLS.ERASER);
    
    if (points.length === 1) {
      this.drawDot(points[0], color, width, isEraser);
      return;
    }
    
    if (isEraser) {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.strokeStyle = 'rgba(0,0,0,1)';
      this.ctx.lineWidth = width * CONFIG.ERASER_MULTIPLIER;
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = width;
    }
    
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      this.ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    
    const lastPoint = points[points.length - 1];
    this.ctx.lineTo(lastPoint.x, lastPoint.y);
    this.ctx.stroke();
    
    this.ctx.globalCompositeOperation = 'source-over';
  }

  drawDot(point, color, width, isEraser = false) {
    if (isEraser) {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.fillStyle = 'rgba(0,0,0,1)';
      const radius = (width * CONFIG.ERASER_MULTIPLIER) / 2;
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.fillStyle = color;
      const radius = width / 2;
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    this.ctx.globalCompositeOperation = 'source-over';
  }

  clear() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  clearRect(x, y, width, height) {
    this.ctx.clearRect(x, y, width, height);
  }
}
