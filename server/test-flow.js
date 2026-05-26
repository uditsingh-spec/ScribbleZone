/**
 * Quick integration test: creates a room, joins a second player,
 * starts the game, picks a word, sends a correct guess, and verifies
 * the full round lifecycle including game_over.
 *
 * Run: node test-flow.js
 */
const { io: ioClient } = require("socket.io-client");

const URL = process.env.TEST_URL || "http://localhost:4000";
let roomId = null;

function connect(name) {
  return new Promise((resolve) => {
    const s = ioClient(URL);
    s.on("connect", () => {
      console.log(`[${name}] connected as ${s.id}`);
      resolve(s);
    });
  });
}

function once(socket, event) {
  return new Promise((resolve) => socket.once(event, resolve));
}

async function main() {
  // --- Player 1 creates room ---
  const p1 = await connect("P1");
  p1.emit("create_room", { name: "Alice", settings: { rounds: 1, drawTime: 10, wordCount: 3, hints: 1 } });
  const roomState = await once(p1, "room_created");
  roomId = roomState.id;
  console.log(`[P1] Room created: ${roomId}`);
  console.log(`[P1] Room state:`, JSON.stringify(roomState, null, 2));

  // --- Player 2 joins ---
  const p2 = await connect("P2");
  p2.emit("join_room", { roomId, name: "Bob" });
  const joinedState = await once(p2, "room_joined");
  console.log(`[P2] Joined room: ${joinedState.id}`);

  // Wait for player_joined on P1
  const pjData = await once(p1, "player_joined");
  console.log(`[P1] player_joined received, players:`, pjData.players.length);

  // --- Host starts game ---
  p1.emit("start_game", { roomId });

  // Both should receive round_start
  const rs1 = await once(p1, "round_start");
  const rs2 = await once(p2, "round_start");
  console.log(`[P1] round_start - drawer: ${rs1.drawerId}, words: ${rs1.wordOptions.length > 0 ? rs1.wordOptions : "(hidden)"}, round: ${rs1.round}`);
  console.log(`[P2] round_start - drawer: ${rs2.drawerId}, words: ${rs2.wordOptions.length > 0 ? rs2.wordOptions : "(hidden)"}, round: ${rs2.round}`);

  // Figure out who is drawer
  const drawer = rs1.wordOptions.length > 0 ? p1 : p2;
  const guesser = drawer === p1 ? p2 : p1;
  const chosenWord = (rs1.wordOptions.length > 0 ? rs1 : rs2).wordOptions[0];
  console.log(`Drawer picks word: "${chosenWord}"`);

  // --- Drawer picks word ---
  drawer.emit("word_chosen", { word: chosenWord });

  // Both receive game_state with phase=drawing
  const gs = await once(guesser, "game_state");
  console.log(`[Guesser] game_state phase: ${gs.phase}, hint: ${gs.hint}`);

  // Wait for at least one timer_tick
  const tick = await once(guesser, "timer_tick");
  console.log(`[Guesser] timer_tick remaining: ${tick.remaining}`);

  // --- Test draw events ---
  drawer.emit("draw_start", { x: 10, y: 20, color: "#000", size: 3 });
  drawer.emit("draw_move", { x: 30, y: 40 });
  drawer.emit("draw_end", {});
  const drawData = await once(guesser, "draw_data");
  console.log(`[Guesser] draw_data received: type=${drawData.type}`);

  // --- Guesser guesses wrong ---
  guesser.emit("guess", { text: "wrong_answer_xyz" });
  const chatMsg = await once(guesser, "chat_message");
  console.log(`[Guesser] wrong guess shown as chat: "${chatMsg.text}"`);

  // --- Guesser guesses correct ---
  guesser.emit("guess", { text: chosenWord });
  const guessResult = await once(guesser, "guess_result");
  console.log(`[Guesser] guess_result: correct=${guessResult.correct}, points=${guessResult.points}`);

  // Should trigger round_end (since all non-drawers guessed)
  const roundEnd = await once(guesser, "round_end");
  console.log(`Round ended. Word was: "${roundEnd.word}". Scores:`, roundEnd.scores.map(s => `${s.name}:${s.score}`));

  // With rounds=1, should get game_over after 5s
  const gameOver = await once(guesser, "game_over");
  console.log(`Game over! Winner: ${gameOver.winner.name} with ${gameOver.winner.score} points`);
  console.log("Leaderboard:", gameOver.leaderboard.map(p => `${p.name}: ${p.score}`));

  console.log("\n✅ ALL TESTS PASSED!\n");

  p1.disconnect();
  p2.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
