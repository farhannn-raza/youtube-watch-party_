import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Extract YouTube video ID from a URL or bare ID string.
 */
export function extractVideoId(input) {
  if (!input) return null;
  const trimmed = input.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.hostname === "youtu.be") return url.pathname.slice(1).split("?")[0];
    if (url.hostname.includes("youtube.com")) {
      return url.searchParams.get("v") || url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/)?.[1];
    }
  } catch {
    /* not a URL */
  }
  return null;
}
