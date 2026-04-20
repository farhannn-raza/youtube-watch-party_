/**
 * Room class — encapsulates all state and logic for a single watch party room.
 */
class Room {
  constructor(roomId, hostId, hostName) {
    this.roomId = roomId;
    this.hostId = hostId;
    this.createdAt = Date.now();

    // Video state
    this.videoState = {
      videoId: "dQw4w9WgXcQ", // default placeholder
      playing: false,
      currentTime: 0,
      lastUpdated: Date.now(),
    };

    // Participants map: socketId -> { socketId, username, role }
    this.participants = new Map();

    // Add host as first participant
    this.participants.set(hostId, {
      socketId: hostId,
      username: hostName,
      role: "host",
    });
  }

  // ─── Participant management ───────────────────────────────────────────────

  addParticipant(socketId, username) {
    const role = socketId === this.hostId ? "host" : "participant";
    this.participants.set(socketId, { socketId, username, role });
    return this.participants.get(socketId);
  }

  removeParticipant(socketId) {
    this.participants.delete(socketId);
  }

  getParticipant(socketId) {
    return this.participants.get(socketId);
  }

  getParticipantsList() {
    return Array.from(this.participants.values());
  }

  hasParticipant(socketId) {
    return this.participants.has(socketId);
  }

  isEmpty() {
    return this.participants.size === 0;
  }

  // ─── Role management ──────────────────────────────────────────────────────

  assignRole(targetSocketId, role) {
    const participant = this.participants.get(targetSocketId);
    if (!participant) return false;
    if (!["host", "moderator", "participant"].includes(role)) return false;
    participant.role = role;
    return true;
  }

  // ─── Permission checks ────────────────────────────────────────────────────

  canControl(socketId) {
    const p = this.participants.get(socketId);
    if (!p) return false;
    return p.role === "host" || p.role === "moderator";
  }

  isHost(socketId) {
    const p = this.participants.get(socketId);
    return p?.role === "host";
  }

  // ─── Video state management ───────────────────────────────────────────────

  updateVideoState(patch) {
    Object.assign(this.videoState, patch, { lastUpdated: Date.now() });
  }

  getVideoState() {
    return { ...this.videoState };
  }

  // ─── Host transfer ────────────────────────────────────────────────────────

  transferHost(currentHostId, newHostId) {
    if (!this.isHost(currentHostId)) return false;
    const currentHost = this.participants.get(currentHostId);
    const newHost = this.participants.get(newHostId);
    if (!newHost) return false;
    currentHost.role = "participant";
    newHost.role = "host";
    this.hostId = newHostId;
    return true;
  }

  // ─── Handle disconnect: promote another if host leaves ───────────────────

  handleHostLeave() {
    if (this.isEmpty()) return null;
    const next = this.participants.values().next().value;
    if (next) {
      next.role = "host";
      this.hostId = next.socketId;
      return next;
    }
    return null;
  }
}

module.exports = Room;
