class Game {
  constructor(settings, players, wordBank) {
    this.totalRounds = settings.rounds;
    this.drawTime = settings.drawTime;
    this.wordCount = settings.wordCount;
    this.hintCount = settings.hints;
    this.wordMode = settings.wordMode; // "normal" | "hidden" | "combination"
    this.players = players; // Player[]
    this.wordBank = wordBank;
    this.customWords = settings.customWords || [];
    this.round = 0;
    this.drawerIndex = 0;
    this.currentWord = null;
    this.wordOptions = [];
    this.currentHint = "";
    this.hintsRevealed = 0;
    this.timer = null;
    this.timeRemaining = 0;
    this.strokeHistory = [];
  }

  getDrawer() {
    return this.players[this.drawerIndex];
  }

  getWordOptions() {
    // Flatten all wordBank categories into one array
    const allWords = [];
    for (const category of Object.values(this.wordBank)) {
      allWords.push(...category);
    }
    // Concat custom words
    allWords.push(...this.customWords);

    // Fisher-Yates shuffle
    for (let i = allWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allWords[i], allWords[j]] = [allWords[j], allWords[i]];
    }

    // Return first wordCount unique words
    const unique = [...new Set(allWords)];
    return unique.slice(0, this.wordCount);
  }

  buildHint(word) {
    // For each character: if space keep as space, else replace with "_"
    // Join with " " between characters
    return word
      .split("")
      .map((ch) => (ch === " " ? " " : "_"))
      .join(" ");
  }

  revealNextHint() {
    // currentHint is like "_ _ _ _ _" or "_ _ a _ _"
    // Find all indices where currentHint still has "_"
    const hintChars = this.currentHint.split(" ");
    const wordChars = this.currentWord.split("");

    const hiddenIndices = [];
    for (let i = 0; i < wordChars.length; i++) {
      if (hintChars[i] === "_") {
        hiddenIndices.push(i);
      }
    }

    if (hiddenIndices.length === 0) return this.currentHint;

    // Pick one random index
    const randIdx =
      hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
    hintChars[randIdx] = wordChars[randIdx];

    this.hintsRevealed++;
    this.currentHint = hintChars.join(" ");
    return this.currentHint;
  }

  calcPoints(timeRemaining) {
    return Math.max(10, Math.floor(100 * (timeRemaining / this.drawTime)));
  }

  recordStroke(stroke) {
    this.strokeHistory.push(stroke);
  }

  clearStrokes() {
    this.strokeHistory = [];
  }

  nextTurn() {
    this.drawerIndex = (this.drawerIndex + 1) % this.players.length;
    if (this.drawerIndex === 0) {
      this.round++;
    }
    // Reset turn state
    this.currentWord = null;
    this.wordOptions = [];
    this.currentHint = "";
    this.hintsRevealed = 0;
    this.strokeHistory = [];
    // Reset all players
    for (const player of this.players) {
      player.reset();
    }
  }

  isOver() {
    return this.round >= this.totalRounds;
  }

  getLeaderboard() {
    return [...this.players]
      .sort((a, b) => b.score - a.score)
      .map((p) => p.toJSON());
  }
}

module.exports = Game;
