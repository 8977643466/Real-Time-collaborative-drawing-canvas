const DrawingState = require('./DrawingState');

class Room {
  constructor(roomId) {
    this.id = roomId;
    this.users = new Map();
    this.drawingState = new DrawingState();
    this.createdAt = Date.now();
  }

  addUser(user) {
    this.users.set(user.id, {
      ...user,
      joinedAt: Date.now()
    });
  }

  removeUser(userId) {
    return this.users.delete(userId);
  }

  getUser(userId) {
    return this.users.get(userId);
  }

  getAllUsers() {
    return Array.from(this.users.values());
  }

  getUserCount() {
    return this.users.size;
  }

  hasUser(userId) {
    return this.users.has(userId);
  }

  getAge() {
    return Date.now() - this.createdAt;
  }
}

module.exports = Room;
