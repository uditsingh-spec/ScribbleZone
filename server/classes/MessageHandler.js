const Player = require("./Player");
const Game = require("./Game");
const Room = require("./Room");

class MessageHandler {
  constructor(io, rooms, wordBank) {
    this.io = io;
    this.rooms = rooms;
    this.wordBank = wordBank;
  }

  handle(socket) {
    socket.on("create_room", (data) => this.onCreateRoom(socket, data));
    socket.on("join_room", (data) => this.onJoinRoom(socket, data));
    socket.on("start_game", (data) => this.onStartGame(socket, data));
    socket.on("word_chosen", (data) => this.onWordChosen(socket, data));
    socket.on("draw_start", (data) => this.onDrawStart(socket, data));
    socket.on("draw_move", (data) => this.onDrawMove(socket, data));
    socket.on("draw_end", (data) => this.onDrawEnd(socket, data));
    socket.on("canvas_clear", (data) => this.onCanvasClear(socket, data));
    socket.on("draw_undo", (data) => this.onDrawUndo(socket, data));
    socket.on("guess", (data) => this.onGuess(socket, data));
    socket.on("chat", (data) => this.onChat(socket, data));
    socket.on("kick_player", (data) => this.onKick(socket, data));
    socket.on("votekick", (data) => this.onVotekick(socket, data));
    socket.on("disconnect", () => this.onDisconnect(socket));
  }

  // ─── Helpers ───────────────────────────────────────────────

  getRoomBySocket(socket, roomId = null) {
    if (roomId) {
      const room = this.rooms.get(roomId);
      if (room && room.getPlayer(socket.id)) {
        return room;
      }
      return null;
    }

    if (socket.data.roomId) {
      const room = this.rooms.get(socket.data.roomId);
      if (room && room.getPlayer(socket.id)) {
        return room;
      }
    }

    for (const room of this.rooms.values()) {
      if (room.getPlayer(socket.id)) {
        return room;
      }
    }
    return null;
  }

  clearRoomTimers(room) {
    if (room.game && room.game.timer) {
      clearInterval(room.game.timer);
      room.game.timer = null;
    }
    if (room._wordSelectionTimeout) {
      clearTimeout(room._wordSelectionTimeout);
      room._wordSelectionTimeout = null;
    }
    if (room._wordSelectionCountdown) {
      clearInterval(room._wordSelectionCountdown);
      room._wordSelectionCountdown = null;
    }
  }

  leaveCurrentRoom(socket, nextRoomId = null) {
    const currentRoom = this.getRoomBySocket(socket);
    if (!currentRoom || currentRoom.id === nextRoomId) return;

    this.removeSocketFromRoom(socket, currentRoom);
  }

  removeSocketFromRoom(socket, room) {
    const removed = room.removePlayer(socket.id);
    socket.leave(room.id);

    if (socket.data.roomId === room.id) {
      socket.data.roomId = null;
    }

    if (!removed) return null;

    // If room is empty, delete it
    if (room.players.length === 0) {
      this.clearRoomTimers(room);
      room.game = null;
      this.rooms.delete(room.id);
      console.log(`Room ${room.id} deleted (empty)`);
      return removed;
    }

    // If removed player was the host, assign new host
    if (room.hostId === socket.id) {
      room.hostId = room.players[0].id;
    }

    room.broadcast(this.io, "player_left", {
      playerId: socket.id,
      hostId: room.hostId,
      players: room.players.map((p) => p.toJSON()),
      spectators: room.spectators.map((p) => p.toJSON()),
    });

    // If game is in progress and not enough players, end the game
    if (
      room.game &&
      (room.phase === "drawing" ||
        room.phase === "word_selection" ||
        room.phase === "round_end")
    ) {
      if (room.players.length < 2) {
        this.endGame(room);
      } else if (
        removed.isDrawing &&
        (room.phase === "drawing" || room.phase === "word_selection")
      ) {
        // If the drawer left, end the current round and move on
        this.clearRoomTimers(room);
        this.endRound(room);
      }
    }

    return removed;
  }

  // ─── Room Lifecycle ────────────────────────────────────────

  onCreateRoom(socket, data) {
    this.leaveCurrentRoom(socket);

    const player = new Player(socket.id, data.name);
    const room = new Room(socket.id, data.settings || {});
    room.addPlayer(player);
    this.rooms.set(room.id, room);
    socket.join(room.id);
    socket.data.roomId = room.id;
    socket.emit("room_created", room.getState());
    console.log(`Room ${room.id} created by ${data.name}`);
  }

  onJoinRoom(socket, data) {
    const room = this.rooms.get(data.roomId);

    if (!room) {
      socket.emit("error", { message: "Room not found" });
      return;
    }

    const player = new Player(socket.id, data.name);

    if (room.bannedIds.includes(player.id)) {
      socket.emit("error", { message: "You are banned" });
      return;
    }

    const existingPlayer = room.getPlayer(socket.id);
    if (existingPlayer) {
      socket.join(room.id);
      socket.data.roomId = room.id;
      socket.emit("room_joined", room.getState());
      return;
    }

    this.leaveCurrentRoom(socket, room.id);

    // If game is already in progress, add as spectator directly
    if (room.phase !== "lobby") {
      player.isSpectator = true;
      room.spectators.push(player);
      socket.join(room.id);
      socket.data.roomId = room.id;
      socket.emit("room_joined", room.getState());
      room.broadcast(this.io, "player_joined", {
        player: player.toJSON(),
        hostId: room.hostId,
        players: room.players.map((p) => p.toJSON()),
        spectators: room.spectators.map((p) => p.toJSON()),
      });
      return;
    }

    room.addPlayer(player);

    socket.join(room.id);
    socket.data.roomId = room.id;
    socket.emit("room_joined", room.getState());
    room.broadcast(this.io, "player_joined", {
      player: player.toJSON(),
      hostId: room.hostId,
      players: room.players.map((p) => p.toJSON()),
      spectators: room.spectators.map((p) => p.toJSON()),
    });
    console.log(`${data.name} joined room ${data.roomId}`);
  }

  onDisconnect(socket) {
    const room = this.getRoomBySocket(socket);
    if (!room) return;

    this.removeSocketFromRoom(socket, room);

    console.log(`Player ${socket.id} disconnected from room ${room.id}`);
  }

  // ─── Game Flow ─────────────────────────────────────────────

  onStartGame(socket, data) {
    const room = this.getRoomBySocket(socket, data?.roomId);
    if (!room) return;

    if (!room.isHost(socket.id)) return;

    if (room.players.length < 2) {
      socket.emit("error", {
        message: "Need at least 2 players",
        room: room.getState(),
      });
      return;
    }

    // Reset all players before starting a new game
    room.players.forEach((p) => {
      p.score = 0;
      p.hasGuessed = false;
      p.isDrawing = false;
    });

    room.phase = "word_selection";
    room.game = new Game(room.settings, room.players, this.wordBank);
    this.startRound(room);
    console.log(`Game started in room ${room.id}`);
  }

  startRound(room) {
    const game = room.game;
    const drawer = game.getDrawer();
    drawer.isDrawing = true;

    const wordOptions = game.getWordOptions();
    game.wordOptions = wordOptions;
    room.phase = "word_selection";

    room.broadcast(this.io, "game_state", room.getState());

    // Word selection timeout: 8 seconds
    const wordSelectionTime = 8;
    let wordSelectionCountdown = wordSelectionTime;

    // Emit word options only to the drawer
    this.io.to(drawer.id).emit("round_start", {
      drawerId: drawer.id,
      wordOptions: wordOptions,
      drawTime: game.drawTime,
      round: game.round + 1,
      wordSelectionTime: wordSelectionTime,
    });

    // Emit to all others without word options
    this.io
      .to(room.id)
      .except(drawer.id)
      .emit("round_start", {
        drawerId: drawer.id,
        wordOptions: [],
        drawTime: game.drawTime,
        round: game.round + 1,
        wordSelectionTime: wordSelectionTime,
      });

    // Countdown timer for word selection
    room._wordSelectionCountdown = setInterval(() => {
      wordSelectionCountdown--;
      room.broadcast(this.io, "word_selection_countdown", {
        remaining: wordSelectionCountdown,
      });

      if (wordSelectionCountdown <= 0) {
        clearInterval(room._wordSelectionCountdown);
        if (room.phase === "word_selection" && game.currentWord === null) {
          // Auto-select a random word
          const randomWord = wordOptions[Math.floor(Math.random() * wordOptions.length)];
          this.beginDrawing(room, randomWord);
        }
      }
    }, 1000);

    // Fallback timeout
    room._wordSelectionTimeout = setTimeout(() => {
      clearInterval(room._wordSelectionCountdown);
      if (room.phase === "word_selection" && game.currentWord === null) {
        const randomWord = wordOptions[Math.floor(Math.random() * wordOptions.length)];
        this.beginDrawing(room, randomWord);
      }
    }, (wordSelectionTime + 1) * 1000);
  }

  onWordChosen(socket, data) {
    const room = this.getRoomBySocket(socket);
    if (!room) return;

    const game = room.game;
    if (!game) return;

    if (socket.id !== game.getDrawer().id) return;
    if (room.phase !== "word_selection") return;

    // Clear the auto-pick timeout and countdown
    if (room._wordSelectionTimeout) {
      clearTimeout(room._wordSelectionTimeout);
      room._wordSelectionTimeout = null;
    }
    if (room._wordSelectionCountdown) {
      clearInterval(room._wordSelectionCountdown);
      room._wordSelectionCountdown = null;
    }

    this.beginDrawing(room, data.word);
  }

  beginDrawing(room, word) {
    const game = room.game;
    game.currentWord = word;
    game.currentHint = game.buildHint(word);
    game.timeRemaining = game.drawTime;
    game.hintsRevealed = 0;
    room.phase = "drawing";

    const hintInterval = Math.floor(game.drawTime / (game.hintCount + 1));

    room.broadcast(this.io, "game_state", {
      phase: "drawing",
      hint: game.currentHint,
      drawTime: game.drawTime,
    });

    game.timer = setInterval(() => {
      game.timeRemaining--;

      room.broadcast(this.io, "timer_tick", {
        remaining: game.timeRemaining,
      });

      // Check if hint is due
      if (
        hintInterval > 0 &&
        game.timeRemaining > 0 &&
        game.timeRemaining % hintInterval === 0 &&
        game.hintsRevealed < game.hintCount
      ) {
        const hint = game.revealNextHint();
        room.broadcast(this.io, "hint_update", { hint });
      }

      if (game.timeRemaining <= 0) {
        clearInterval(game.timer);
        game.timer = null;
        this.endRound(room);
      }
    }, 1000);
  }

  endRound(room) {
    if (room.game && room.game.timer) {
      clearInterval(room.game.timer);
      room.game.timer = null;
    }
    if (room._wordSelectionTimeout) {
      clearTimeout(room._wordSelectionTimeout);
      room._wordSelectionTimeout = null;
    }
    if (room._wordSelectionCountdown) {
      clearInterval(room._wordSelectionCountdown);
      room._wordSelectionCountdown = null;
    }

    room.phase = "round_end";

    room.broadcast(this.io, "round_end", {
      word: room.game.currentWord,
      scores: room.game.getLeaderboard(),
      strokeHistory: room.game.strokeHistory,
    });

    setTimeout(() => {
      // Guard: room or game may have been cleaned up during the timeout
      if (!room.game || !this.rooms.has(room.id) || room.players.length < 2) {
        return;
      }

      room.game.nextTurn();

      if (room.game.isOver()) {
        this.endGame(room);
      } else {
        this.startRound(room);
      }
    }, 5000);
  }

  endGame(room) {
    this.clearRoomTimers(room);

    room.phase = "game_over";

    const leaderboard = room.game ? room.game.getLeaderboard() : [];

    room.broadcast(this.io, "game_over", {
      winner: leaderboard[0] || null,
      leaderboard: leaderboard,
    });

    room.game = null;
  }

  // ─── Drawing Events ───────────────────────────────────────

  onDrawStart(socket, data) {
    const room = this.getRoomBySocket(socket);
    if (!room || !room.game) return;
    if (socket.id !== room.game.getDrawer().id) return;

    const stroke = {
      type: "start",
      x: data.x,
      y: data.y,
      color: data.color,
      size: data.size,
    };
    room.game.recordStroke(stroke);
    room.broadcast(this.io, "draw_data", stroke);
  }

  onDrawMove(socket, data) {
    const room = this.getRoomBySocket(socket);
    if (!room || !room.game) return;
    if (socket.id !== room.game.getDrawer().id) return;

    const stroke = { type: "move", x: data.x, y: data.y };
    room.game.recordStroke(stroke);
    room.broadcast(this.io, "draw_data", stroke);
  }

  onDrawEnd(socket, data) {
    const room = this.getRoomBySocket(socket);
    if (!room || !room.game) return;
    if (socket.id !== room.game.getDrawer().id) return;

    const stroke = { type: "end" };
    room.game.recordStroke(stroke);
    room.broadcast(this.io, "draw_data", stroke);
  }

  onCanvasClear(socket, data) {
    const room = this.getRoomBySocket(socket);
    if (!room || !room.game) return;
    if (socket.id !== room.game.getDrawer().id) return;

    room.game.clearStrokes();
    room.broadcast(this.io, "canvas_cleared", {});
  }

  onDrawUndo(socket, data) {
    const room = this.getRoomBySocket(socket);
    if (!room || !room.game) return;
    if (socket.id !== room.game.getDrawer().id) return;

    const strokeHistory = room.game.strokeHistory;
    // Find last index where type === 'start', remove from there to end
    let lastStartIdx = -1;
    for (let i = strokeHistory.length - 1; i >= 0; i--) {
      if (strokeHistory[i].type === "start") {
        lastStartIdx = i;
        break;
      }
    }

    if (lastStartIdx !== -1) {
      strokeHistory.splice(lastStartIdx);
    }

    room.broadcast(this.io, "draw_undo", {
      strokeHistory: room.game.strokeHistory,
    });
  }

  // ─── Guessing & Chat ──────────────────────────────────────

  onGuess(socket, data) {
    const room = this.getRoomBySocket(socket);
    if (!room) return;

    const game = room.game;
    if (!game || room.phase !== "drawing") return;

    const player = room.getPlayer(socket.id);
    if (!player) return;
    if (player.isDrawing || player.hasGuessed || player.isSpectator) return;

    const guess = data.text.toLowerCase().trim();
    const correct = guess === game.currentWord.toLowerCase().trim();

    if (correct) {
      player.hasGuessed = true;
      const points = game.calcPoints(game.timeRemaining);
      player.addPoints(points);
      game.getDrawer().addPoints(10);

      room.broadcast(this.io, "guess_result", {
        correct: true,
        playerId: socket.id,
        playerName: player.name,
        points,
      });

      // Check if all non-drawer players have guessed
      const allGuessed = game.players
        .filter((p) => !p.isDrawing)
        .every((p) => p.hasGuessed);

      if (allGuessed) {
        clearInterval(game.timer);
        game.timer = null;
        this.endRound(room);
      }
    } else {
      // Wrong guess — show as chat message
      room.broadcast(this.io, "chat_message", {
        playerId: socket.id,
        playerName: player.name,
        text: data.text,
        isGuess: true,
      });
    }
  }

  onChat(socket, data) {
    const room = this.getRoomBySocket(socket);
    if (!room) return;

    const player = room.getPlayer(socket.id);
    if (!player) return;

    // Drawer cannot chat during drawing phase (to prevent leaking the word)
    if (player.isDrawing && room.phase === "drawing") return;

    room.broadcast(this.io, "chat_message", {
      playerId: socket.id,
      playerName: player.name,
      text: data.text,
      isGuess: false,
    });
  }

  // ─── Moderation ────────────────────────────────────────────

  onKick(socket, data) {
    const room = this.getRoomBySocket(socket);
    if (!room) return;
    if (!room.isHost(socket.id)) return;

    room.kickPlayer(data.targetId);

    this.io
      .to(data.targetId)
      .emit("kicked", { message: "You were kicked by the host" });

    room.broadcast(this.io, "player_left", {
      playerId: data.targetId,
      players: room.players.map((p) => p.toJSON()),
    });
  }

  onVotekick(socket, data) {
    const room = this.getRoomBySocket(socket);
    if (!room) return;

    const result = room.voteKick(socket.id, data.targetId);

    room.broadcast(this.io, "votekick_update", {
      targetId: data.targetId,
      votes: room.votekickMap[data.targetId]?.size || 0,
      needed: Math.floor(room.players.length / 2) + 1,
    });

    if (result === true) {
      this.io
        .to(data.targetId)
        .emit("kicked", { message: "You were votekicked" });

      room.broadcast(this.io, "player_left", {
        playerId: data.targetId,
        players: room.players.map((p) => p.toJSON()),
      });
    }
  }
}

module.exports = MessageHandler;
