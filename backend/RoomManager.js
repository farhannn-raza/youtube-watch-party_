const Room = require("./Room");

/**
 * RoomManager — singleton store for all active rooms.
 */
class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomId -> Room
  }

  createRoom(roomId, hostId, hostName) {
    const room = new Room(roomId, hostId, hostName);
    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId) || null;
  }

  roomExists(roomId) {
    return this.rooms.has(roomId);
  }

  deleteRoom(roomId) {
    this.rooms.delete(roomId);
  }

  getRoomCount() {
    return this.rooms.size;
  }

  // Find which room a socket is in
  findRoomBySocket(socketId) {
    for (const room of this.rooms.values()) {
      if (room.hasParticipant(socketId)) return room;
    }
    return null;
  }
}

module.exports = new RoomManager(); // export singleton
