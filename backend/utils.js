const { v4: uuidv4 } = require("uuid");

/**
 * Generate a short, human-friendly room ID (6 uppercase chars).
 */
function generateRoomId() {
  return uuidv4().replace(/-/g, "").substring(0, 6).toUpperCase();
}

/**
 * Extract YouTube video ID from various URL formats or return as-is if already an ID.
 */
function extractVideoId(input) {
  if (!input) return null;

  // Already a bare video ID (11 chars, alphanumeric + _ -)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) {
    return input.trim();
  }

  try {
    const url = new URL(input);
    // youtu.be/VIDEO_ID
    if (url.hostname === "youtu.be") {
      return url.pathname.slice(1).split("?")[0];
    }
    // youtube.com/watch?v=VIDEO_ID
    if (url.hostname.includes("youtube.com")) {
      return url.searchParams.get("v");
    }
    // youtube.com/embed/VIDEO_ID
    const embedMatch = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];
  } catch {
    // Not a URL — return null
  }

  return null;
}

module.exports = { generateRoomId, extractVideoId };
