import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const socket = io(BACKEND_URL, {
  autoConnect: false,
});

export default socket;
