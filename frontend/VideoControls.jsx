import React, { useState } from "react";
import { extractVideoId } from "../utils/socket";
import "./VideoControls.css";

export default function VideoControls({
  canControl,
  videoState,
  onPlay,
  onPause,
  onSeek,
  onChangeVideo,
}) {
  const [videoInput, setVideoInput] = useState("");
  const [inputError, setInputError] = useState("");

  const handleChangeVideo = () => {
    const id = extractVideoId(videoInput.trim());
    if (!id) {
      setInputError("Invalid YouTube URL or video ID");
      return;
    }
    setInputError("");
    onChangeVideo(id);
    setVideoInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleChangeVideo();
  };

  return (
    <div className="controls">
      {/* Playback buttons */}
      <div className="controls__playback">
        <button
          className="controls__btn controls__btn--play"
          disabled={!canControl}
          onClick={() => videoState?.playing ? onPause(0) : onPlay(0)}
          title={canControl ? (videoState?.playing ? "Pause" : "Play") : "Only Host/Moderator can control"}
        >
          {videoState?.playing ? (
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <rect x="6" y="4" width="4" height="16" rx="1"/>
              <rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
          {videoState?.playing ? "Pause" : "Play"}
        </button>

        {/* Status indicator */}
        <div className={`controls__status ${videoState?.playing ? "controls__status--live" : ""}`}>
          <span className="controls__dot" />
          {videoState?.playing ? "LIVE SYNC" : "PAUSED"}
        </div>
      </div>

      {/* Change video */}
      <div className="controls__video-input">
        <input
          type="text"
          placeholder="Paste YouTube URL or video ID…"
          value={videoInput}
          onChange={(e) => { setVideoInput(e.target.value); setInputError(""); }}
          onKeyDown={handleKeyDown}
          disabled={!canControl}
          className={inputError ? "input--error" : ""}
        />
        <button
          className="controls__btn controls__btn--change"
          disabled={!canControl || !videoInput.trim()}
          onClick={handleChangeVideo}
        >
          Load Video
        </button>
        {inputError && <span className="controls__error">{inputError}</span>}
      </div>

      {!canControl && (
        <p className="controls__hint">
          👁 You are a viewer. Only the Host or Moderator can control playback.
        </p>
      )}
    </div>
  );
}
