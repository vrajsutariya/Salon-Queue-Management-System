import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 30000,
  transports: ['websocket', 'polling'],
});
