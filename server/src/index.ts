import { createServer } from 'node:http';
import { Server } from 'socket.io';
import {
  type ClientToServerMessage,
  type Zone,
} from '@pk/shared';
import {
  keeperForShooter,
  LobbyStore,
  lobbyStateMessage,
  matchStartMessage,
  RECONNECT_MS,
  sideForPlayer,
  startPickTimer,
  tryResolveTurn,
  type Lobby,
} from './rooms/lobbyStore.js';

const PORT = Number(process.env.PORT ?? 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGIN, methods: ['GET', 'POST'] },
});

const store = new LobbyStore();

function emitLobby(lobby: Lobby): void {
  io.to(lobby.host.id).emit('message', lobbyStateMessage(lobby, true));
  if (lobby.guest) {
    io.to(lobby.guest.id).emit('message', lobbyStateMessage(lobby, false));
  }
}

function emitBoth(lobby: Lobby, msg: unknown): void {
  io.to(lobby.host.id).emit('message', msg);
  if (lobby.guest) io.to(lobby.guest.id).emit('message', msg);
}

function startTurn(lobby: Lobby): void {
  startPickTimer(lobby, () => handlePickClock(lobby));
}

function handlePickClock(lobby: Lobby): void {
  const { match } = lobby;

  if (match.pendingKickZone === null) {
    match.pendingKickZone = 4 as Zone;
  }
  if (match.pendingKeepZone === null) {
    match.pendingKeepZone = 4 as Zone;
  }

  const msg = tryResolveTurn(lobby);
  if (!msg) return;
  emitBoth(lobby, msg);
  if (msg.type === 'match_end') {
    lobby.status = 'finished';
    return;
  }
  startTurn(lobby);
}

function validateZone(zone: number): zone is Zone {
  return Number.isInteger(zone) && zone >= 0 && zone <= 8;
}

function beginMatch(lobby: Lobby): void {
  lobby.status = 'playing';
  lobby.match = {
    round: 1,
    score: { host: 0, guest: 0 },
    kicker: 'host',
    isSuddenDeath: false,
    isComplete: false,
    winner: null,
    sdPairHostKickerWin: null,
    sdPairGuestKickerWin: null,
    pendingKickZone: null,
    pendingKeepZone: null,
  };

  if (lobby.host) {
    io.to(lobby.host.id).emit('message', matchStartMessage(lobby, 'host'));
  }
  if (lobby.guest) {
    io.to(lobby.guest.id).emit('message', matchStartMessage(lobby, 'guest'));
  }
  startTurn(lobby);
}

io.on('connection', (socket) => {
  socket.on('message', (raw: ClientToServerMessage) => {
    const lobby = store.getLobbyForPlayer(socket.id);

    switch (raw.type) {
      case 'create_lobby': {
        if (lobby) {
          socket.emit('message', { type: 'error', code: 'match_in_progress', message: 'Already in a lobby' });
          return;
        }
        const created = store.createLobby(socket.id);
        socket.emit('message', lobbyStateMessage(created, true));
        break;
      }

      case 'join_lobby': {
        if (lobby) {
          socket.emit('message', { type: 'error', code: 'match_in_progress', message: 'Already in a lobby' });
          return;
        }
        const joined = store.joinLobby(raw.code, socket.id);
        if (!joined) {
          socket.emit('message', {
            type: 'error',
            code: joined === null ? 'invalid_code' : 'lobby_full',
            message: 'Invalid or full lobby',
          });
          return;
        }
        emitLobby(joined);
        break;
      }

      case 'player_ready': {
        if (!lobby) return;
        const side = sideForPlayer(lobby, socket.id);
        if (!side) return;
        if (side === 'host') lobby.host.ready = raw.ready;
        else if (lobby.guest) lobby.guest.ready = raw.ready;
        emitLobby(lobby);
        break;
      }

      case 'start_match': {
        if (!lobby || lobby.status !== 'waiting') {
          socket.emit('message', { type: 'error', code: 'not_ready', message: 'Lobby not ready' });
          return;
        }
        if (!lobby.guest || !lobby.host.ready || !lobby.guest.ready) {
          socket.emit('message', { type: 'error', code: 'not_ready', message: 'Both players must be ready' });
          return;
        }
        beginMatch(lobby);
        break;
      }

      case 'submit_zone_pick': {
        if (!lobby || lobby.status !== 'playing') return;
        if (!validateZone(raw.zone)) return;

        const side = sideForPlayer(lobby, socket.id);
        if (!side) return;

        const kicker = lobby.match.kicker;
        const keeper = keeperForShooter(kicker);

        if (side === kicker) {
          if (lobby.match.pendingKickZone !== null) {
            socket.emit('message', { type: 'error', code: 'double_submit', message: 'Pick already submitted' });
            return;
          }
          lobby.match.pendingKickZone = raw.zone;
        } else if (side === keeper) {
          if (lobby.match.pendingKeepZone !== null) {
            socket.emit('message', { type: 'error', code: 'double_submit', message: 'Pick already submitted' });
            return;
          }
          lobby.match.pendingKeepZone = raw.zone;
        } else {
          socket.emit('message', { type: 'error', code: 'not_your_turn', message: 'Not participating this turn' });
          return;
        }

        const msg = tryResolveTurn(lobby);
        if (msg) {
          emitBoth(lobby, msg);
          if (msg.type === 'match_end') return;
          startTurn(lobby);
        }
        break;
      }

      case 'rematch': {
        if (!lobby) return;
        if (lobby.status !== 'finished') return;
        lobby.status = 'waiting';
        lobby.host.ready = false;
        if (lobby.guest) lobby.guest.ready = false;
        lobby.match = {
          round: 1,
          score: { host: 0, guest: 0 },
          kicker: 'host',
          isSuddenDeath: false,
          isComplete: false,
          winner: null,
          sdPairHostKickerWin: null,
          sdPairGuestKickerWin: null,
          pendingKickZone: null,
          pendingKeepZone: null,
        };
        emitLobby(lobby);
        break;
      }

      default:
        break;
    }
  });

  socket.on('disconnect', () => {
    const lobby = store.getLobbyForPlayer(socket.id);
    if (!lobby) return;

    const wasHost = lobby.host.id === socket.id;
    const wasGuest = lobby.guest?.id === socket.id;

    store.removePlayer(socket.id);

    if (wasHost) {
      if (lobby.guest) {
        io.to(lobby.guest.id).emit('message', {
          type: 'opponent_disconnected',
          reconnectWindowMs: RECONNECT_MS,
        });
      }
      return;
    }

    if (wasGuest) {
      io.to(lobby.host.id).emit('message', {
        type: 'opponent_disconnected',
        reconnectWindowMs: RECONNECT_MS,
      });
      emitLobby(lobby);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Penalty Kings server listening on :${PORT}`);
});
