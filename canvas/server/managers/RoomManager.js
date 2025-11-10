const Room = require('../models/Room');

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  getOrCreateRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Room(roomId));
    }
    return this.rooms.get(roomId);
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  deleteRoom(roomId) {
    return this.rooms.delete(roomId);
  }

  getRoomCount() {
    return this.rooms.size;
  }

  getAllRooms() {
    return Array.from(this.rooms.values());
  }

  getStats() {
    let totalUsers = 0;
    let totalOperations = 0;

    this.rooms.forEach(room => {
      totalUsers += room.getUserCount();
      totalOperations += room.drawingState.getOperationCount();
    });

    return {
      roomCount: this.rooms.size,
      totalUsers,
      totalOperations
    };
  }
}

module.exports = RoomManager;
