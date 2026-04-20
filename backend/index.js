const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const roomManager = require("./RoomManager");
const SocketHandler = require("./SocketHandler");

// ─── App setup ────────────────────────────────────────────────────────────────

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: [FRONTEND_URL, "http://localhost:5173", "http://localhost:4173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors({ origin: [FRONTEND_URL, "http://localhost:5173"], credentials: true }));
app.use(express.json());

// ─── REST API ─────────────────────────────────────────────────────────────────

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    rooms: roomManager.getRoomCount(),
    uptime: process.uptime(),
  });
});

app.get("/api/room/:roomId", (req, res) => {
  const room = roomManager.getRoom(req.params.roomId.toUpperCase());
  if (!room) return res.status(404).json({ error: "Room not found" });
  res.json({
    roomId: room.roomId,
    participantCount: room.participants.size,
    videoState: room.getVideoState(),
  });
});

// ─── Socket.IO ────────────────────────────────────────────────────────────────

io.on("connection", (socket) => {
  console.log(`[Connect] ${socket.id}`);
  new SocketHandler(io, socket);
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🎬 WatchParty backend running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});
