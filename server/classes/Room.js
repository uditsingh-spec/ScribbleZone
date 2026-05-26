const crypto = require("crypto");

class Room {
  constructor(hostId, settings) {
    // Generate 6-char uppercase code from uuid
    this.id = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
    this.hostId = hostId;
    const maxPlayers = Number(settings.maxPlayers) || 8;

    this.settings = {
      maxPlayers: Math.max(2, maxPlayers),
      rounds: settings.rounds || 3,
      drawTime: settings.drawTime || 80,
      wordCount: settings.wordCount || 3,
      hints: settings.hints || 2,
      wordMode: settings.wordMode || "normal",
      isPrivate: settings.isPrivate || false,
      customWords: settings.customWords || [],
    };
    this.players = [];
    this.spectators = [];
    this.game = null;
    this.phase = "lobby";
    this.bannedIds = [];
    this.votekickMap = {}; // { targetId: Set<voterId> }
  }

  addPlayer(player) {
    if (this.bannedIds.includes(player.id)) {
      return { error: "banned" };
    }

    if (this.players.length >= this.settings.maxPlayers) {
      player.isSpectator = true;
      this.spectators.push(player);
      return { spectator: true };
    }

    this.players.push(player);
    return { success: true };
  }

  removePlayer(id) {
    // Search players
    let idx = this.players.findIndex((p) => p.id === id);
    if (idx !== -1) {
      return this.players.splice(idx, 1)[0];
    }

    // Search spectators
    idx = this.spectators.findIndex((p) => p.id === id);
    if (idx !== -1) {
      return this.spectators.splice(idx, 1)[0];
    }

    return null;
  }

  getPlayer(id) {
    const player = this.players.find((p) => p.id === id);
    if (player) return player;

    const spectator = this.spectators.find((p) => p.id === id);
    return spectator || null;
  }

  isHost(id) {
    return this.hostId === id;
  }

  kickPlayer(targetId) {
    this.removePlayer(targetId);
    this.bannedIds.push(targetId);
  }

  voteKick(voterId, targetId) {
    if (!this.votekickMap[targetId]) {
      this.votekickMap[targetId] = new Set();
    }

    this.votekickMap[targetId].add(voterId);

    if (this.votekickMap[targetId].size > Math.floor(this.players.length / 2)) {
      this.kickPlayer(targetId);
      return true;
    }

    return false;
  }

  broadcast(io, event, data) {
    io.to(this.id).emit(event, data);
  }

  broadcastExcept(io, excludeSocketId, event, data) {
    io.to(this.id).except(excludeSocketId).emit(event, data);
  }

  getState() {
    return {
      id: this.id,
      hostId: this.hostId,
      phase: this.phase,
      settings: this.settings,
      players: this.players.map((p) => p.toJSON()),
      spectators: this.spectators.map((p) => p.toJSON()),
    };
  }
}

module.exports = Room;
