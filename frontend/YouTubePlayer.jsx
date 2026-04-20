import React, { useEffect, useRef, useCallback } from "react";

let ytApiReady = false;
let ytApiCallbacks = [];

function loadYTApi() {
  if (window.YT && window.YT.Player) {
    ytApiReady = true;
    return;
  }
  if (document.getElementById("yt-api-script")) return;

  const tag = document.createElement("script");
  tag.id = "yt-api-script";
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);

  window.onYouTubeIframeAPIReady = () => {
    ytApiReady = true;
    ytApiCallbacks.forEach((cb) => cb());
    ytApiCallbacks = [];
  };
}

function onYTReady(cb) {
  if (ytApiReady) {
    cb();
  } else {
    ytApiCallbacks.push(cb);
    loadYTApi();
  }
}

/**
 * YouTubePlayer component
 *
 * Props:
 *  videoId      - YouTube video ID to load
 *  videoState   - { playing, currentTime } from server
 *  canControl   - whether this user may control playback
 *  onPlay       - called when user presses play (time)
 *  onPause      - called when user presses pause (time)
 *  onSeek       - called when user seeks (time)
 */
export default function YouTubePlayer({
  videoId,
  videoState,
  canControl,
  onPlay,
  onPause,
  onSeek,
}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const ignoreNextEvent = useRef(false); // suppress echo events from server sync
  const lastVideoId = useRef(null);
  const ready = useRef(false);

  // ─── Init player ──────────────────────────────────────────────────────────

  useEffect(() => {
    onYTReady(() => {
      if (!containerRef.current || playerRef.current) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: videoId || "dQw4w9WgXcQ",
        playerVars: {
          autoplay: 0,
          controls: canControl ? 1 : 0,
          rel: 0,
          modestbranding: 1,
          fs: 1,
        },
        events: {
          onReady: () => {
            ready.current = true;
            lastVideoId.current = videoId;
          },
          onStateChange: handleStateChange,
        },
      });
    });

    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
        ready.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Sync incoming video state from server ───────────────────────────────

  useEffect(() => {
    if (!ready.current || !playerRef.current || !videoState) return;
    const player = playerRef.current;

    // Change video if needed
    if (videoId && videoId !== lastVideoId.current) {
      ignoreNextEvent.current = true;
      player.loadVideoById({ videoId, startSeconds: videoState.currentTime || 0 });
      lastVideoId.current = videoId;
      return;
    }

    ignoreNextEvent.current = true;

    try {
      const currentTime = player.getCurrentTime?.() || 0;
      const diff = Math.abs(currentTime - (videoState.currentTime || 0));

      // Only seek if out of sync by more than 1.5 seconds
      if (diff > 1.5) {
        player.seekTo(videoState.currentTime || 0, true);
      }

      if (videoState.playing) {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
    } catch {}

    // Reset ignore flag after a short delay
    setTimeout(() => { ignoreNextEvent.current = false; }, 500);
  }, [videoState, videoId]);

  // ─── Handle player events → emit to server ───────────────────────────────

  const handleStateChange = useCallback(
    (event) => {
      if (!canControl) return;
      if (ignoreNextEvent.current) return;

      const { YT } = window;
      const player = playerRef.current;
      if (!player) return;

      const state = event.data;
      const time = player.getCurrentTime?.() || 0;

      if (state === YT.PlayerState.PLAYING) {
        onPlay?.(time);
      } else if (state === YT.PlayerState.PAUSED) {
        onPause?.(time);
      }
    },
    [canControl, onPlay, onPause]
  );

  // Keep event handler ref fresh
  useEffect(() => {
    if (!playerRef.current) return;
    playerRef.current.handleStateChange = handleStateChange;
  }, [handleStateChange]);

  return (
    <div className="yt-wrapper">
      <div ref={containerRef} />
      {!canControl && (
        <div className="yt-overlay" title="Only Host/Moderator can control playback" />
      )}
    </div>
  );
}
