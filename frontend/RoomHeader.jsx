import React, { useState } from "react";
import "./RoomHeader.css";

export default function RoomHeader({ roomId, myRole, participantCount, onLeave }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <header className="room-header">
      <div className="room-header__left">
        <span className="room-header__logo">▶</span>
        <span className="room-header__brand">WatchParty</span>
      </div>

      <div className="room-header__center">
        <button className="room-header__code" onClick={copyCode} title="Click to copy room code">
          <span className="room-header__code-label">ROOM</span>
          <span className="room-header__code-value">{roomId}</span>
          <span className="room-header__code-copy">{copied ? "✓ Copied" : "Copy"}</span>
        </button>
        <span className="room-header__participants">
          {participantCount} {participantCount === 1 ? "person" : "people"}
        </span>
      </div>

      <div className="room-header__right">
        <span className={`tag tag--${myRole}`}>{myRole}</span>
        <button className="room-header__leave" onClick={onLeave}>
          Leave
        </button>
      </div>
    </header>
  );
}
