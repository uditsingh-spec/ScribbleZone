require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { db } = require("./db/database");
const wordBank = require("./data/words.json");
const MessageHandler = require("./classes/MessageHandler");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// In-memory room store
const rooms = new Map();

// Middleware
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  new MessageHandler(io, rooms, wordBank).handle(socket);
});

// Routes
app.get("/ping", (req, res) => {
  res.json({ status: "ok" });
});

// Start
server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
