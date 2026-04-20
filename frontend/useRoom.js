import { useState, useEffect, useRef, useCallback } from "react";
import { getSocket } from "../utils/socket";

export function useSocket() {
  const socket = getSocket();
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket]);

  return { socket, connected };
}

export function useRoom() {
  const { socket, connected } = useSocket();

  const [roomId, setRoomId] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [videoState, setVideoState] = useState(null);
  const [error, setError] = useState(null);
  const [kicked, setKicked] = useState(false);

  const isHost = myRole === "host";
  const canControl = myRole === "host" || myRole === "moderator";

  // ─── Join / Create ──────────────────────────────────────────────────────

  const createRoom = useCallback((username) => {
    return new Promise((resolve, reject) => {
      socket.emit("create_room", { username }, (res) => {
        if (res.error) return reject(res.error);
        setRoomId(res.roomId);
        setMyRole(res.role);
        setParticipants(res.participants);
        setVideoState(res.videoState);
        resolve(res);
      });
    });
  }, [socket]);

  const joinRoom = useCallback((roomId, username) => {
    return new Promise((resolve, reject) => {
      socket.emit("join_room", { roomId, username }, (res) => {
        if (res.error) return reject(res.error);
        setRoomId(res.roomId);
        setMyRole(res.role);
        setParticipants(res.participants);
        setVideoState(res.videoState);
        resolve(res);
      });
    });
  }, [socket]);

  const leaveRoom = useCallback(() => {
    socket.emit("leave_room");
    setRoomId(null);
    setMyRole(null);
    setParticipants([]);
    setVideoState(null);
    setKicked(false);
  }, [socket]);

  // ─── Playback controls ──────────────────────────────────────────────────

  const emitPlay = useCallback((currentTime) => {
    socket.emit("play", { currentTime });
  }, [socket]);

  const emitPause = useCallback((currentTime) => {
    socket.emit("pause", { currentTime });
  }, [socket]);

  const emitSeek = useCallback((time) => {
    socket.emit("seek", { time });
  }, [socket]);

  const emitChangeVideo = useCallback((videoId) => {
    socket.emit("change_video", { videoId });
  }, [socket]);

  // ─── Role & participant management ──────────────────────────────────────

  const assignRole = useCallback((userId, role) => {
    return new Promise((resolve, reject) => {
      socket.emit("assign_role", { userId, role }, (res) => {
        if (res?.error) return reject(res.error);
        resolve(res);
      });
    });
  }, [socket]);

  const removeParticipant = useCallback((userId) => {
    return new Promise((resolve, reject) => {
      socket.emit("remove_participant", { userId }, (res) => {
        if (res?.error) return reject(res.error);
        resolve(res);
      });
    });
  }, [socket]);

  // ─── Incoming events ────────────────────────────────────────────────────

  useEffect(() => {
    if (!roomId) return;

    const onSyncState = (state) => setVideoState(state);

    const onUserJoined = ({ participants: p }) => setParticipants(p);
    const onUserLeft = ({ participants: p, newHost }) => {
      setParticipants(p);
      // If I became host (after previous host left), update my role
      if (newHost?.userId === socket.id) setMyRole("host");
    };

    const onRoleAssigned = ({ userId, role, participants: p }) => {
      setParticipants(p);
      if (userId === socket.id) setMyRole(role);
    };

    const onParticipantRemoved = ({ participants: p }) => setParticipants(p);
    const onKicked = () => {
      setKicked(true);
      setRoomId(null);
      setMyRole(null);
      setParticipants([]);
      setVideoState(null);
    };

    socket.on("sync_state", onSyncState);
    socket.on("user_joined", onUserJoined);
    socket.on("user_left", onUserLeft);
    socket.on("role_assigned", onRoleAssigned);
    socket.on("participant_removed", onParticipantRemoved);
    socket.on("kicked", onKicked);

    return () => {
      socket.off("sync_state", onSyncState);
      socket.off("user_joined", onUserJoined);
      socket.off("user_left", onUserLeft);
      socket.off("role_assigned", onRoleAssigned);
      socket.off("participant_removed", onParticipantRemoved);
      socket.off("kicked", onKicked);
    };
  }, [roomId, socket]);

  return {
    socket,
    connected,
    roomId,
    myRole,
    isHost,
    canControl,
    participants,
    videoState,
    setVideoState,
    error,
    setError,
    kicked,
    setKicked,
    createRoom,
    joinRoom,
    leaveRoom,
    emitPlay,
    emitPause,
    emitSeek,
    emitChangeVideo,
    assignRole,
    removeParticipant,
  };
}
