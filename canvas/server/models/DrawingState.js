class DrawingState {
  constructor() {
    this.operations = [];
    this.currentIndex = -1;
    this.maxOperations = 500;
  }

  addOperation(operation) {
    this.operations = this.operations.slice(0, this.currentIndex + 1);
    this.operations.push(operation);
    this.currentIndex++;

    if (this.operations.length > this.maxOperations) {
      const trimCount = this.operations.length - this.maxOperations;
      this.operations = this.operations.slice(trimCount);
      this.currentIndex -= trimCount;
    }

    return operation;
  }

  updateStroke(strokeId, points) {
    const operation = this.operations.find(op => op.id === strokeId);
    
    if (operation) {
      operation.points = points;
      return operation;
    }
    return null;
  }

  undo() {
    if (this.currentIndex >= 0) {
      const undoneOperation = this.operations[this.currentIndex];
      this.currentIndex--;
      return undoneOperation;
    }
    return null;
  }

  redo() {
    if (this.currentIndex < this.operations.length - 1) {
      this.currentIndex++;
      return this.operations[this.currentIndex];
    }
    return null;
  }

  getCurrentState() {
    return this.operations.slice(0, this.currentIndex + 1);
  }

  clear() {
    this.operations = [];
    this.currentIndex = -1;
  }

  canUndo() {
    return this.currentIndex >= 0;
  }

  canRedo() {
    return this.currentIndex < this.operations.length - 1;
  }

  getOperationCount() {
    return this.operations.length;
  }
}

module.exports = DrawingState;
