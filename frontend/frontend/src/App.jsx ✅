import React from "react";
import { useRoom } from "./hooks/useRoom";
import Lobby from "./components/Lobby";
import Room from "./components/Room";

export default function App() {
  const {
    socket,
    connected,
    roomId,
    myRole,
    isHost,
    canControl,
    participants,
    videoState,
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
  } = useRoom();

  // ── Not in a room → show Lobby ─────────────────────────────────────────
  if (!roomId) {
    return (
      <Lobby
        connected={connected}
        kicked={kicked}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
      />
    );
  }

  // ── In a room → show Room view ─────────────────────────────────────────
  return (
    <Room
      roomId={roomId}
      myRole={myRole}
      isHost={isHost}
      canControl={canControl}
      participants={participants}
      videoState={videoState}
      socket={socket}
      onLeave={() => {
        leaveRoom();
        setKicked(false);
      }}
      onPlay={emitPlay}
      onPause={emitPause}
      onSeek={emitSeek}
      onChangeVideo={emitChangeVideo}
      onAssignRole={assignRole}
      onRemoveParticipant={removeParticipant}
    />
  );
}
