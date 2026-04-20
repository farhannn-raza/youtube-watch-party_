import React, { useEffect, useRef } from "react";
import RoomHeader from "./RoomHeader";
import YouTubePlayer from "./YouTubePlayer";
import VideoControls from "./VideoControls";
import ParticipantList from "./ParticipantList";
import "./Room.css";

export default function Room({
  roomId,
  myRole,
  canControl,
  isHost,
  participants,
  videoState,
  socket,
  onLeave,
  onPlay,
  onPause,
  onSeek,
  onChangeVideo,
  onAssignRole,
  onRemoveParticipant,
}) {
  const videoId = videoState?.videoId;

  return (
    <div className="room">
      <RoomHeader
        roomId={roomId}
        myRole={myRole}
        participantCount={participants.length}
        onLeave={onLeave}
      />

      <div className="room__body">
        {/* Main video area */}
        <div className="room__main">
          <div className="room__player-wrap">
            <YouTubePlayer
              videoId={videoId}
              videoState={videoState}
              canControl={canControl}
              onPlay={onPlay}
              onPause={onPause}
              onSeek={onSeek}
            />
          </div>

          <VideoControls
            canControl={canControl}
            videoState={videoState}
            onPlay={onPlay}
            onPause={onPause}
            onSeek={onSeek}
            onChangeVideo={onChangeVideo}
          />
        </div>

        {/* Sidebar */}
        <aside className="room__sidebar">
          <ParticipantList
            participants={participants}
            mySocketId={socket?.id}
            isHost={isHost}
            onAssignRole={onAssignRole}
            onRemoveParticipant={onRemoveParticipant}
          />
        </aside>
      </div>
    </div>
  );
}
