# 🎬 WatchParty

> Watch YouTube videos together, perfectly in sync.

A full-stack real-time Watch Party app. Multiple users join a room and see the same video state — play, pause, seek, and video changes are broadcast instantly to everyone via WebSockets.

---

## Folder Structure

```
watchparty/                        ← root (GitHub repo)
├── .gitignore
├── package.json                   ← root convenience scripts
├── render.yaml                    ← Render deploy config (backend)
├── vercel.json                    ← Vercel deploy config (frontend)
├── README.md
│
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js               ← Express + Socket.IO server
│       ├── Room.js                ← Room class (OOP state + permissions)
│       ├── RoomManager.js         ← Singleton store of all rooms
│       ├── SocketHandler.js       ← All socket event handlers
│       └── utils.js               ← generateRoomId, extractVideoId
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── .env.example
    └── src/
        ├── main.jsx
        ├── App.jsx                ← Root: Lobby ↔ Room routing
        ├── index.css              ← Global styles + CSS variables
        ├── hooks/
        │   └── useRoom.js         ← All socket state + emit actions
        ├── utils/
        │   └── socket.js          ← Socket.IO singleton + helpers
        └── components/
            ├── Lobby.jsx          ← Create / Join screen
            ├── Lobby.css
            ├── Room.jsx           ← Main room layout
            ├── Room.css
            ├── RoomHeader.jsx     ← Top bar: room code, role, leave
            ├── RoomHeader.css
            ├── YouTubePlayer.jsx  ← YouTube IFrame API wrapper
            ├── VideoControls.jsx  ← Play/pause/seek/change video
            ├── VideoControls.css
            ├── ParticipantList.jsx ← Sidebar + role management
            └── ParticipantList.css
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Real-time | Socket.IO 4 |
| Video | YouTube IFrame API |
| Styling | Plain CSS + CSS variables |
| Deploy | Vercel (frontend) + Render (backend) |

---

## Role System

| Role | Play/Pause | Seek | Change Video | Assign Roles | Remove Users |
|------|:---------:|:----:|:------------:|:------------:|:------------:|
| **Host** | Yes | Yes | Yes | Yes | Yes |
| **Moderator** | Yes | Yes | Yes | No | No |
| **Participant** | No | No | No | No | No |

Room creator is always the Host. All permission checks are enforced on the **backend**.

---

## Running Locally

### Prerequisites
- Node.js v18+ and npm

### 1 — Install dependencies

```bash
# From the repo root
npm run install:all

# Or manually:
cd backend && npm install
cd ../frontend && npm install
```

### 2 — Configure environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env:
#   PORT=3001
#   FRONTEND_URL=http://localhost:5173

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env:
#   VITE_BACKEND_URL=http://localhost:3001
```

### 3 — Start servers

Open **two terminals**:

```bash
# Terminal 1 — backend
cd backend
npm run dev
# Runs on http://localhost:3001

# Terminal 2 — frontend
cd frontend
npm run dev
# Runs on http://localhost:5173
```

Open `http://localhost:5173` in two browser tabs. Create a room in one, join with the code in the other — sync works instantly.

---

## Socket.IO Events

### Client to Server

| Event | Payload | Who can send |
|-------|---------|-------------|
| `create_room` | `{ username }` | Anyone |
| `join_room` | `{ roomId, username }` | Anyone |
| `leave_room` | — | Anyone |
| `play` | `{ currentTime }` | Host / Moderator |
| `pause` | `{ currentTime }` | Host / Moderator |
| `seek` | `{ time }` | Host / Moderator |
| `change_video` | `{ videoId }` | Host / Moderator |
| `assign_role` | `{ userId, role }` | Host only |
| `remove_participant` | `{ userId }` | Host only |
| `transfer_host` | `{ userId }` | Host only |

### Server to Client

| Event | Payload | Description |
|-------|---------|-------------|
| `sync_state` | `{ videoId, playing, currentTime }` | Broadcast new video state |
| `user_joined` | `{ username, userId, role, participants }` | Someone joined |
| `user_left` | `{ username, userId, participants, newHost? }` | Someone left |
| `role_assigned` | `{ userId, username, role, participants }` | Role changed |
| `participant_removed` | `{ userId, participants }` | User was kicked |
| `kicked` | `{ message }` | You were removed from room |

---

## Deployment

### Backend on Render

1. Push repo to GitHub
2. Go to [render.com](https://render.com) → New Web Service → connect your repo
3. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add environment variables:
   ```
   PORT=3001
   FRONTEND_URL=https://your-app.vercel.app
   ```
5. Deploy and note your Render URL

### Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → import your repo
2. Set:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add environment variable:
   ```
   VITE_BACKEND_URL=https://your-backend.onrender.com
   ```
4. Deploy

After both are live, update `FRONTEND_URL` on Render to your Vercel URL so CORS is correctly configured.

---

## Architecture Overview

```
Browser
  ├── YouTube IFrame API  → embedded player, fires state events
  └── Socket.IO client    → sends events, receives sync broadcasts

Node.js Server
  ├── Express             → REST: /health, /api/room/:id
  └── Socket.IO Server
        ├── SocketHandler → per-connection event registration
        ├── RoomManager   → singleton Map of roomId → Room
        └── Room          → OOP: video state, participants, permissions
```

**Sync flow:**
1. Host clicks Play → frontend emits `play { currentTime }`
2. `SocketHandler` checks `room.canControl(socketId)` → passes
3. Room state updated: `{ playing: true, currentTime }`
4. Server broadcasts `sync_state` to the entire room
5. Each client's `YouTubePlayer` calls `player.playVideo()`, seeks if drift > 1.5s

---

## Live Demo

> Add your deployed URLs here after deployment:
>
> Frontend: https://your-app.vercel.app
> Backend: https://your-backend.onrender.com
