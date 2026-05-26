<div align="center">

# 🎨 Skribbl Clone

### Draw. Guess. Win! — Real-time multiplayer Pictionary game

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Play_Now!-00E5A0?style=for-the-badge&logoColor=white)](https://skribbl-clone-eight.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Skribbl--Clone-FFD700?style=for-the-badge&logo=github&logoColor=black)](https://github.com/Kunal-imsec/Skribbl-Clone)

![Made with Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Made with React](https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=flat-square&logo=socket.io&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Deployed on Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
![Deployed on Render](https://img.shields.io/badge/Render-46E3B7?style=flat-square&logo=render&logoColor=black)

</div>

---

## 🎮 How to Play

> **1.** Enter your name → avatar auto-generates  
> **2.** Create a room or join with a 6-letter room code  
> **3.** Host configures settings and starts the game  
> **4.** One player draws — others type guesses in chat  
> **5.** Faster correct guess = more points. Most points wins! 🏆  

---

## ✨ Features

### 🎨 Core Gameplay
| Feature | Description |
|---|---|
| 🖌️ Real-time Drawing | Canvas strokes sync instantly to all players via WebSockets |
| 💬 Live Chat & Guessing | Type guesses in chat — correct guess scores points |
| 💡 Progressive Hints | Letters reveal over time `_ p _ _ _` → `_ p p l _` |
| ⏱️ Server-side Timer | Countdown lives on server only — no client cheating |
| 🔄 Round Replay | Watch the drawing animate stroke by stroke after each round |
| 🏆 Leaderboard | Live scores, ranked podium, winner screen |

### 🏠 Rooms
| Feature | Description |
|---|---|
| 🔒 Private Rooms | Invite-only via shareable link |
| 🌐 Public Rooms | Join via 6-letter room code |
| ⚙️ Configurable Settings | Players, rounds, draw time, hints, word count |
| 📝 Custom Word Lists | Host can add their own words |

### 🃏 Word Modes
| Mode | How it works |
|---|---|
| **Normal** | Drawer sees word, others guess from blanks |
| **Hidden** | Drawer doesn't see the word either — interprets a prompt |
| **Combination** | Two words combined — drawer draws both concepts |

### 🛡️ Moderation & More
- 👁️ **Spectator Mode** — auto-assigned when room is full
- 👢 **Kick & Ban** — host can remove players
- 🗳️ **Votekick** — majority vote removes a player
- 📱 **Mobile Touch Support** — canvas works on touch devices
- 🎭 **DiceBear Avatars** — unique avatar per player name

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | UI, pages, game screens |
| Canvas | HTML5 Canvas API (raw) | Drawing, stroke sync |
| Backend | Node.js + Express | API, game logic |
| WebSockets | Socket.IO | Real-time sync |
| Database | SQLite (better-sqlite3) | Rooms, scores, words |
| Avatars | DiceBear API | URL-based player avatars |
| Deploy FE | Vercel | Frontend hosting |
| Deploy BE | Render | Backend + WebSocket hosting |

---

## 🏗️ Architecture

```
React (UI + Canvas)
      ↕ Socket.IO (WebSocket)
Node.js + Express (Game Logic)
      ↕
  SQLite + words.json
```

### OOP Backend Structure

```
📦 server/classes/
├── 👤 Player.js       — id, name, score, avatar, state flags
├── 🎮 Game.js         — rounds, timer, word, hints, scoring, stroke history  
├── 🏠 Room.js         — players, spectators, settings, phase, moderation
└── 📨 MessageHandler.js — routes all Socket.IO events to Room/Game methods
```

### Game State Machine

```
LOBBY → WORD_SELECTION → DRAWING → ROUND_END → (loop or GAME_OVER)
```

---

## 🌐 WebSocket Events

### Room & Lobby
| Event | Direction | Description |
|---|---|---|
| `create_room` | C → S | Host creates room with settings |
| `join_room` | C → S | Player joins by room code |
| `player_joined` | S → C | Broadcast new player to room |
| `start_game` | C → S | Host starts game |

### Game Flow
| Event | Direction | Description |
|---|---|---|
| `round_start` | S → C | New round — drawer gets word options |
| `word_chosen` | C → S | Drawer picks a word |
| `timer_tick` | S → C | Countdown every second |
| `hint_update` | S → C | New letter revealed |
| `round_end` | S → C | Word reveal + scores + stroke history |
| `game_over` | S → C | Winner + full leaderboard |

### Drawing
| Event | Direction | Description |
|---|---|---|
| `draw_start/move/end` | C → S | Drawer's canvas strokes |
| `draw_data` | S → C | Broadcast strokes to all clients |
| `canvas_clear` | C → S | Drawer clears canvas |
| `draw_undo` | C → S | Drawer undoes last stroke |

### Chat & Guessing
| Event | Direction | Description |
|---|---|---|
| `guess` | C → S | Player submits a guess |
| `guess_result` | S → C | Correct/wrong + points awarded |
| `chat` | C → S | General chat message |
| `chat_message` | S → C | Broadcast chat to room |

---

## 💻 Local Setup

### Prerequisites
- Node.js 18+
- npm

### Clone & Install

```bash
git clone https://github.com/Kunal-imsec/Skribbl-Clone.git
cd Skribbl-Clone
```

### Start Backend

```bash
cd server
npm install
npm run dev
# Server runs on http://localhost:4000
```

### Start Frontend

```bash
cd client
npm install
npm run dev
# App runs on http://localhost:5173
```

### Environment Variables

```bash
# server/.env
PORT=4000
CLIENT_URL=http://localhost:5173

# client/.env
VITE_BACKEND_URL=http://localhost:4000
```

---

## 🚀 Deployment

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel | https://skribbl-clone-eight.vercel.app/ |
| Backend | Render | https://skribbl-clone-gc2h.onrender.com |

> ⚡ Backend stays alive via UptimeRobot pinging `/ping` every 5 minutes

---

## 📁 Folder Structure

```
skribbl-clone/
├── client/                        # React + Vite + TypeScript
│   └── src/
│       ├── pages/
│       │   ├── Home.tsx           # Name entry, create/join room
│       │   ├── Lobby.tsx          # Player list, settings, start
│       │   └── Game.tsx           # Canvas, chat, scoreboard
│       ├── components/
│       │   ├── Canvas.tsx         # Drawing + real-time sync
│       │   ├── Chat.tsx           # Guess input + messages
│       │   ├── Timer.tsx          # Circular countdown
│       │   ├── HintDisplay.tsx    # Progressive letter reveal
│       │   ├── WordSelector.tsx   # Drawer picks a word
│       │   ├── PlayerList.tsx     # Scores + avatars
│       │   ├── DrawingTools.tsx   # Colors, brush, undo
│       │   ├── RoundEnd.tsx       # Word reveal + replay
│       │   └── GameOver.tsx       # Podium + leaderboard
│       └── socket.ts              # Socket.IO client singleton
│
└── server/                        # Node.js + Express
    ├── classes/
    │   ├── Player.js
    │   ├── Game.js
    │   ├── Room.js
    │   └── MessageHandler.js
    ├── data/words.json            # 60 words across 6 categories
    ├── db/database.js             # SQLite setup
    └── index.js                   # Express + Socket.IO entry
```

---

## 🧑‍💻 Code Walkthrough

**How drawing sync works:**
Canvas mouse events → `draw_start/move/end` emitted → server records stroke in `game.strokeHistory` → broadcasts `draw_data` to all clients → viewers render stroke on their canvas in real time.

**How game state is managed:**
Server is single source of truth. `Game` class owns rounds, turn order, timer (`setInterval`), hints, and scores. State changes are broadcast via `game_state` and phase-specific events.

**How guessing works:**
`guess.toLowerCase().trim() === currentWord.toLowerCase().trim()` — simple normalize + compare. Correct → points calculated by `Math.floor(100 * (timeRemaining / drawTime))`, minimum 10 pts.

**Why Render over Railway:**
Render has stable persistent WebSocket support on free tier. Railway had connection instability during testing.

---

<div align="center">

Made with 🎨 by **Kunal Agrawal**

[![Portfolio](https://img.shields.io/badge/Portfolio-kunalragdev.netlify.app-FFD700?style=flat-square)](https://kunalragdev.netlify.app)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Kunal_Agrawal-0077B5?style=flat-square&logo=linkedin)](https://linkedin.com/in/kunal-agrawal-b3637826a)
[![GitHub](https://img.shields.io/badge/GitHub-Kunal--imsec-181717?style=flat-square&logo=github)](https://github.com/Kunal-imsec)

</div>
