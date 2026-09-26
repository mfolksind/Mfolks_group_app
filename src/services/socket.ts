import { io, Socket } from 'socket.io-client';

const DEFAULT_SOCKET_URL = 'https://api.mfolks.com';

const SOCKET_BASE_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL?.trim().replace(/\/$/, '') ||
  process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '') ||
  DEFAULT_SOCKET_URL;

let socket: Socket | null = null;
let currentToken: string | null = null;

type SocketCallback = (socket: Socket) => void;

const socketReadyCallbacks = new Set<SocketCallback>();

export const onSocketReady = (callback: SocketCallback) => {
  socketReadyCallbacks.add(callback);

  // If socket already exists and is connected
  if (socket?.connected) {
    callback(socket);
  }

  return () => {
    socketReadyCallbacks.delete(callback);
  };
};

const notifySocketReady = () => {
  if (!socket?.connected) return;

  socketReadyCallbacks.forEach((callback) => {
    try {
      callback(socket!);
    } catch (error) {
      console.warn('[Socket] Callback error:', error);
    }
  });
};

export const initSocket = (token: string): Socket => {
  // Already connected with same token
  if (socket?.connected && currentToken === token) {
    return socket;
  }

  // Disconnect old socket
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  currentToken = token;

  socket = io(SOCKET_BASE_URL, {
    auth: {
      token,
    },

    transports: ['websocket', 'polling'],

    autoConnect: true,

    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log(
      '[Socket] Connected:',
      socket?.id
    );

    notifySocketReady();
  });

  socket.on('connect_error', (error) => {
    console.warn(
      '[Socket] Connection error:',
      error.message
    );
  });

  socket.on('disconnect', (reason) => {
    console.log(
      '[Socket] Disconnected:',
      reason
    );
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  socket = null;
  currentToken = null;
};