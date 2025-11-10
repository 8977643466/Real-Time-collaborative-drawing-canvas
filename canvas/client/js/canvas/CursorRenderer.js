class CursorRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.cursors = new Map();
    this.animationFrameId = null;
    
    this.startAnimation();
  }

  updateCursor(userId, x, y, color, name) {
    this.cursors.set(userId, {
      x, y, color,
      name: name || 'User',
      lastUpdate: Date.now()
    });
  }

  removeCursor(userId) {
    this.cursors.delete(userId);
  }

  clearAll() {
    this.cursors.clear();
  }

  startAnimation() {
    const animate = () => {
      this.render();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  stopAnimation() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    const now = Date.now();
    
    this.cursors.forEach((cursor, userId) => {
      if (now - cursor.lastUpdate > CONFIG.CURSOR_TIMEOUT) {
        this.cursors.delete(userId);
        return;
      }
      
      this.drawCursor(cursor);
    });
  }

  drawCursor(cursor) {
    const { x, y, color, name } = cursor;
    
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(x, y, CONFIG.CURSOR_RING_RADIUS, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, CONFIG.CURSOR_DOT_RADIUS, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.font = '12px sans-serif';
    this.ctx.fillStyle = color;
    this.ctx.fillText(name, x + 15, y - 10);
  }

  destroy() {
    this.stopAnimation();
    this.clearAll();
  }
}
