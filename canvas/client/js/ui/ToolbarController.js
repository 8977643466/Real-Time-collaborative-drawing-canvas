class ToolbarController {
  constructor(canvasManager, socketHandler) {
    this.canvas = canvasManager;
    this.socket = socketHandler;
    
    this.colorPicker = document.getElementById('colorPicker');
    this.brushSize = document.getElementById('brushSize');
    this.sizeValue = document.getElementById('sizeValue');
    this.undoBtn = document.getElementById('undoBtn');
    this.redoBtn = document.getElementById('redoBtn');
    this.clearBtn = document.getElementById('clearBtn');
    this.toolButtons = document.querySelectorAll('.tool-btn');
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.toolButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.toolButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        const tool = e.target.dataset.tool;
        this.canvas.setTool(tool);
        
        console.log(`🔧 Tool: ${tool}`);
      });
    });

    this.colorPicker.addEventListener('input', (e) => {
      this.canvas.setColor(e.target.value);
    });

    this.brushSize.addEventListener('input', (e) => {
      const size = parseInt(e.target.value);
      this.canvas.setWidth(size);
      this.sizeValue.textContent = size;
    });

    this.undoBtn.addEventListener('click', () => {
      this.socket.emitUndo();
    });

    this.redoBtn.addEventListener('click', () => {
      this.socket.emitRedo();
    });

    this.clearBtn.addEventListener('click', () => {
      this.socket.emitClear();
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.socket.emitUndo();
      }
      
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        this.socket.emitRedo();
      }
    });
  }

  setUndoEnabled(enabled) {
    this.undoBtn.disabled = !enabled;
  }

  setRedoEnabled(enabled) {
    this.redoBtn.disabled = !enabled;
  }
}
