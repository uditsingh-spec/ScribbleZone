class Player {
  constructor(id, name) {
    this.id = id; // socket.id
    this.name = name;
    this.score = 0;
    this.hasGuessed = false;
    this.isDrawing = false;
    this.isSpectator = false;
    this.avatar = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${name}`;
  }

  addPoints(points) {
    this.score += points;
  }

  reset() {
    this.hasGuessed = false;
    this.isDrawing = false;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      score: this.score,
      hasGuessed: this.hasGuessed,
      isDrawing: this.isDrawing,
      isSpectator: this.isSpectator,
      avatar: this.avatar,
    };
  }
}

module.exports = Player;
