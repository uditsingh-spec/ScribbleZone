/**
 * Regression test for a host socket creating more than one room.
 *
 * Run with a server already listening:
 *   TEST_URL=http://localhost:4000 node test-active-room.js
 */
const { io: ioClient } = require("socket.io-client");

const URL = process.env.TEST_URL || "http://localhost:4000";
const TIMEOUT_MS = 5000;

function connect(name) {
  return new Promise((resolve, reject) => {
    const socket = ioClient(URL);
    const timer = setTimeout(
      () => reject(new Error(`[${name}] timed out connecting to ${URL}`)),
      TIMEOUT_MS
    );

    socket.once("connect", () => {
      clearTimeout(timer);
      console.log(`[${name}] connected as ${socket.id}`);
      resolve(socket);
    });

    socket.once("connect_error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

function once(socket, event) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out waiting for ${event}`)),
      TIMEOUT_MS
    );

    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

function waitForRoundStart(socket) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Timed out waiting for round_start")),
      TIMEOUT_MS
    );

    const cleanup = () => {
      clearTimeout(timer);
      socket.off("round_start", onRoundStart);
      socket.off("error", onError);
    };

    const onRoundStart = (data) => {
      cleanup();
      resolve(data);
    };

    const onError = (data) => {
      cleanup();
      reject(new Error(`Unexpected start error: ${data.message}`));
    };

    socket.once("round_start", onRoundStart);
    socket.once("error", onError);
  });
}

async function main() {
  const sockets = [];

  try {
    const host = await connect("Host");
    sockets.push(host);

    host.emit("create_room", {
      name: "Host",
      settings: { rounds: 1, drawTime: 10, wordCount: 3, hints: 1 },
    });
    const staleRoom = await once(host, "room_created");
    console.log(`[Host] created first room: ${staleRoom.id}`);

    host.emit("create_room", {
      name: "Host",
      settings: { rounds: 1, drawTime: 10, wordCount: 3, hints: 1 },
    });
    const activeRoom = await once(host, "room_created");
    console.log(`[Host] created active room: ${activeRoom.id}`);

    const p2 = await connect("P2");
    sockets.push(p2);
    p2.emit("join_room", { roomId: activeRoom.id, name: "Bob" });
    await once(p2, "room_joined");
    await once(host, "player_joined");

    const p3 = await connect("P3");
    sockets.push(p3);
    p3.emit("join_room", { roomId: activeRoom.id, name: "Casey" });
    await once(p3, "room_joined");
    await once(host, "player_joined");

    host.emit("start_game", { roomId: activeRoom.id });
    const roundStart = await waitForRoundStart(host);

    console.log(
      `Active room ${activeRoom.id} started. Drawer: ${roundStart.drawerId}`
    );
    console.log("✅ active-room regression passed");
  } finally {
    for (const socket of sockets) {
      socket.disconnect();
    }
  }
}

main().catch((err) => {
  console.error("❌ active-room regression failed:", err);
  process.exit(1);
});
