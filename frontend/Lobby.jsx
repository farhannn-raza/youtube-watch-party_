import React, { useState } from "react";
import "./Lobby.css";

export default function Lobby({ onCreateRoom, onJoinRoom, connected, kicked }) {
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [mode, setMode] = useState("create"); // "create" | "join"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const name = username.trim();
    if (!name) return setError("Please enter your name");
    if (mode === "join" && !roomCode.trim()) return setError("Please enter a room code");

    setLoading(true);
    setError("");
    try {
      if (mode === "create") {
        await onCreateRoom(name);
      } else {
        await onJoinRoom(roomCode.trim().toUpperCase(), name);
      }
    } catch (err) {
      setError(typeof err === "string" ? err : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="lobby">
      <div className="lobby__bg" />

      <div className="lobby__card fade-in">
        {/* Header */}
        <div className="lobby__header">
          <div className="lobby__logo">▶</div>
          <h1 className="lobby__title">WatchParty</h1>
          <p className="lobby__subtitle">Watch YouTube together, in sync.</p>
        </div>

        {kicked && (
          <div className="lobby__alert lobby__alert--danger">
            You were removed from the room.
          </div>
        )}

        {!connected && (
          <div className="lobby__alert lobby__alert--warn">
            <span style={{ animation: "pulse 1s infinite" }}>●</span> Connecting to server…
          </div>
        )}

        {/* Mode toggle */}
        <div className="lobby__toggle">
          <button
            className={`lobby__toggle-btn ${mode === "create" ? "active" : ""}`}
            onClick={() => { setMode("create"); setError(""); }}
          >
            Create Room
          </button>
          <button
            className={`lobby__toggle-btn ${mode === "join" ? "active" : ""}`}
            onClick={() => { setMode("join"); setError(""); }}
          >
            Join Room
          </button>
        </div>

        {/* Form */}
        <div className="lobby__form">
          <div className="lobby__field">
            <label className="lobby__label">Your Name</label>
            <input
              type="text"
              placeholder="Enter your display name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKey}
              maxLength={24}
              autoFocus
            />
          </div>

          {mode === "join" && (
            <div className="lobby__field fade-in">
              <label className="lobby__label">Room Code</label>
              <input
                type="text"
                placeholder="6-character room code (e.g. AB12CD)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                onKeyDown={handleKey}
                maxLength={6}
                style={{ textTransform: "uppercase", letterSpacing: "0.15em" }}
              />
            </div>
          )}

          {error && <p className="lobby__error">{error}</p>}

          <button
            className="lobby__submit"
            onClick={handleSubmit}
            disabled={loading || !connected}
          >
            {loading ? "Connecting…" : mode === "create" ? "Create Room →" : "Join Room →"}
          </button>
        </div>

        {/* Info */}
        <div className="lobby__info">
          <div className="lobby__info-item">
            <span className="lobby__info-icon">🎬</span>
            <span>Sync YouTube videos in real time</span>
          </div>
          <div className="lobby__info-item">
            <span className="lobby__info-icon">👥</span>
            <span>Invite friends with a room code</span>
          </div>
          <div className="lobby__info-item">
            <span className="lobby__info-icon">🎛</span>
            <span>Host controls playback for everyone</span>
          </div>
        </div>
      </div>
    </div>
  );
}
