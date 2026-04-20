const roomManager = require("./RoomManager");
const { generateRoomId } = require("./utils");

/**
 * SocketHandler — registers and handles all Socket.IO events for a connection.
 */
class SocketHandler {
  constructor(io, socket) {
    this.io = io;
    this.socket = socket;
    this.registerEvents();
  }

  registerEvents() {
    const { socket } = this;

    socket.on("create_room", (data, callback) => this.onCreateRoom(data, callback));
    socket.on("join_room", (data, callback) => this.onJoinRoom(data, callback));
    socket.on("leave_room", () => this.onLeaveRoom());
    socket.on("disconnect", () => this.onDisconnect());

    socket.on("play", (data) => this.onPlay(data));
    socket.on("pause", (data) => this.onPause(data));
    socket.on("seek", (data) => this.onSeek(data));
    socket.on("change_video", (data) => this.onChangeVideo(data));

    socket.on("assign_role", (data, callback) => this.onAssignRole(data, callback));
    socket.on("remove_participant", (data, callback) => this.onRemoveParticipant(data, callback));
    socket.on("transfer_host", (data, callback) => this.onTransferHost(data, callback));

    socket.on("get_state", (data, callback) => this.onGetState(data, callback));
  }

  // ─── Room creation & joining ──────────────────────────────────────────────

  onCreateRoom({ username } = {}, callback) {
    if (!username?.trim()) return callback?.({ error: "Username is required" });

    const roomId = generateRoomId();
    const room = roomManager.createRoom(roomId, this.socket.id, username.trim());

    this.socket.join(roomId);

    callback?.({
      success: true,
      roomId,
      role: "host",
      participants: room.getParticipantsList(),
      videoState: room.getVideoState(),
    });

    console.log(`[Room Created] ${roomId} by ${username}`);
  }

  onJoinRoom({ roomId, username } = {}, callback) {
    if (!username?.trim()) return callback?.({ error: "Username is required" });
    if (!roomId?.trim()) return callback?.({ error: "Room ID is required" });

    const room = roomManager.getRoom(roomId.toUpperCase());
    if (!room) return callback?.({ error: "Room not found" });

    const participant = room.addParticipant(this.socket.id, username.trim());
    this.socket.join(roomId.toUpperCase());

    callback?.({
      success: true,
      roomId: roomId.toUpperCase(),
      role: participant.role,
      participants: room.getParticipantsList(),
      videoState: room.getVideoState(),
    });

    // Notify others
    this.socket.to(roomId.toUpperCase()).emit("user_joined", {
      username: participant.username,
      userId: this.socket.id,
      role: participant.role,
      participants: room.getParticipantsList(),
    });

    console.log(`[Room Joined] ${username} -> ${roomId}`);
  }

  onLeaveRoom() {
    this._handleLeave();
  }

  onDisconnect() {
    this._handleLeave();
  }

  _handleLeave() {
    const room = roomManager.findRoomBySocket(this.socket.id);
    if (!room) return;

    const participant = room.getParticipant(this.socket.id);
    if (!participant) return;

    const wasHost = room.isHost(this.socket.id);
    room.removeParticipant(this.socket.id);

    if (room.isEmpty()) {
      roomManager.deleteRoom(room.roomId);
      console.log(`[Room Deleted] ${room.roomId} (empty)`);
      return;
    }

    // If host left, assign next person as host
    let newHost = null;
    if (wasHost) {
      newHost = room.handleHostLeave();
    }

    this.io.to(room.roomId).emit("user_left", {
      username: participant.username,
      userId: this.socket.id,
      participants: room.getParticipantsList(),
      newHost: newHost ? { userId: newHost.socketId, username: newHost.username } : null,
    });

    console.log(`[User Left] ${participant.username} from ${room.roomId}`);
  }

  // ─── Playback controls ────────────────────────────────────────────────────

  onPlay({ currentTime } = {}) {
    const room = roomManager.findRoomBySocket(this.socket.id);
    if (!room || !room.canControl(this.socket.id)) return;

    const time = parseFloat(currentTime) || 0;
    room.updateVideoState({ playing: true, currentTime: time });

    this.io.to(room.roomId).emit("sync_state", room.getVideoState());
  }

  onPause({ currentTime } = {}) {
    const room = roomManager.findRoomBySocket(this.socket.id);
    if (!room || !room.canControl(this.socket.id)) return;

    const time = parseFloat(currentTime) || 0;
    room.updateVideoState({ playing: false, currentTime: time });

    this.io.to(room.roomId).emit("sync_state", room.getVideoState());
  }

  onSeek({ time } = {}) {
    const room = roomManager.findRoomBySocket(this.socket.id);
    if (!room || !room.canControl(this.socket.id)) return;

    const seekTime = parseFloat(time);
    if (isNaN(seekTime)) return;

    room.updateVideoState({ currentTime: seekTime });
    this.io.to(room.roomId).emit("sync_state", room.getVideoState());
  }

  onChangeVideo({ videoId } = {}) {
    const room = roomManager.findRoomBySocket(this.socket.id);
    if (!room || !room.canControl(this.socket.id)) return;

    if (!videoId?.trim()) return;
    room.updateVideoState({ videoId: videoId.trim(), playing: false, currentTime: 0 });

    this.io.to(room.roomId).emit("sync_state", room.getVideoState());
  }

  // ─── Role & participant management ───────────────────────────────────────

  onAssignRole({ userId, role } = {}, callback) {
    const room = roomManager.findRoomBySocket(this.socket.id);
    if (!room || !room.isHost(this.socket.id)) {
      return callback?.({ error: "Only the host can assign roles" });
    }

    const success = room.assignRole(userId, role);
    if (!success) return callback?.({ error: "Invalid user or role" });

    const updated = room.getParticipant(userId);
    this.io.to(room.roomId).emit("role_assigned", {
      userId,
      username: updated.username,
      role,
      participants: room.getParticipantsList(),
    });

    callback?.({ success: true });
  }

  onRemoveParticipant({ userId } = {}, callback) {
    const room = roomManager.findRoomBySocket(this.socket.id);
    if (!room || !room.isHost(this.socket.id)) {
      return callback?.({ error: "Only the host can remove participants" });
    }

    const target = room.getParticipant(userId);
    if (!target) return callback?.({ error: "User not found" });

    room.removeParticipant(userId);

    // Force the removed socket out of the room
    this.io.sockets.sockets.get(userId)?.leave(room.roomId);

    this.io.to(room.roomId).emit("participant_removed", {
      userId,
      participants: room.getParticipantsList(),
    });

    // Tell the removed user they were kicked
    this.io.to(userId).emit("kicked", { message: "You were removed from the room" });

    callback?.({ success: true });
  }

  onTransferHost({ userId } = {}, callback) {
    const room = roomManager.findRoomBySocket(this.socket.id);
    if (!room || !room.isHost(this.socket.id)) {
      return callback?.({ error: "Only the host can transfer host" });
    }

    const success = room.transferHost(this.socket.id, userId);
    if (!success) return callback?.({ error: "Transfer failed" });

    this.io.to(room.roomId).emit("role_assigned", {
      userId,
      username: room.getParticipant(userId).username,
      role: "host",
      participants: room.getParticipantsList(),
    });

    callback?.({ success: true });
  }

  onGetState({ roomId } = {}, callback) {
    const room = roomManager.getRoom(roomId?.toUpperCase());
    if (!room) return callback?.({ error: "Room not found" });

    callback?.({
      videoState: room.getVideoState(),
      participants: room.getParticipantsList(),
    });
  }
}

module.exports = SocketHandler;
