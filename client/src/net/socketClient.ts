import type {
  ClientToServerMessage,
  ServerToClientMessage,
} from '@pk/shared';
import { io, type Socket } from 'socket.io-client';

const SERVER_URL = resolveServerUrl();

function resolveServerUrl(): string {
  const raw = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw.replace(/\/$/, '');
  }
  return `https://${raw.replace(/\/$/, '')}`;
}

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) socket.disconnect();
}

export function sendMessage(msg: ClientToServerMessage): void {
  getSocket().emit('message', msg);
}

export function onServerMessage(handler: (msg: ServerToClientMessage) => void): () => void {
  const s = getSocket();
  const listener = (msg: ServerToClientMessage) => handler(msg);
  s.on('message', listener);
  return () => s.off('message', listener);
}

export function onSocketConnect(handler: () => void): () => void {
  const s = getSocket();
  s.on('connect', handler);
  return () => s.off('connect', handler);
}

export function onSocketDisconnect(handler: () => void): () => void {
  const s = getSocket();
  s.on('disconnect', handler);
  return () => s.off('disconnect', handler);
}
