import { createServer } from 'node:http';
import { Server } from 'socket.io';
import {
  type ClientToServerMessage,
  centerZone,
  getZoneGrid,
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
import {
  emitTeamLobby,
  emitTurnResultAndContinue,
  fillAiPicks,
  getActivePickControllers,
  isTeamMessage,
  resolveTeamPickClock,
  startTeamTurn,
  TeamLobbyStore,
  TEAM_RECONNECT_MS,
  tryResolveTeamTurn,
  validateTeamZone,
  type TeamLobby,
} from './rooms/teamLobbyStore.js';

function resolvePort(): number {
  const parsed = Number(process.env.PORT);
  if (Number.isInteger(parsed) && parsed > 0) return parsed;
  return 3001;
}

const PORT = resolvePort();

function normalizeOrigin(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : `https://${trimmed}`;
}

const corsOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map(normalizeOrigin).filter(Boolean)
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

const httpServer = createServer((req, res) => {
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Penalty Kings server is running. Open the client at http://localhost:5173');
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

const io = new Server(httpServer, {
  cors: { origin: corsOrigins, methods: ['GET', 'POST'] },
});

const store = new LobbyStore();
const teamStore = new TeamLobbyStore();

function teamPickExpire(lobby: TeamLobby): () => void {
  return () => resolveTeamPickClock(teamStore, lobby, io, teamPickExpire(lobby));
}

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

const ONLINE_ZONE_GRID = getZoneGrid('pro');

function handlePickClock(lobby: Lobby): void {
  const { match } = lobby;
  const defaultZone = centerZone(ONLINE_ZONE_GRID);

  if (match.pendingKickZone === null) {
    match.pendingKickZone = defaultZone;
  }
  if (match.pendingKeepZone === null) {
    match.pendingKeepZone = defaultZone;
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
  return Number.isInteger(zone) && zone >= 0 && zone < ONLINE_ZONE_GRID.rows * ONLINE_ZONE_GRID.cols;
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

function handleTeamMessage(socketId: string, raw: ClientToServerMessage): boolean {
  if (!isTeamMessage(raw.type)) return false;

  const teamLobby = teamStore.getLobbyForPlayer(socketId);

  switch (raw.type) {
    case 'create_team_lobby': {
      if (teamLobby || store.getLobbyForPlayer(socketId)) {
        io.to(socketId).emit('message', {
          type: 'error',
          code: 'match_in_progress',
          message: 'Already in a lobby',
        });
        return true;
      }
      const created = teamStore.createLobby(socketId, raw);
      emitTeamLobby(teamStore, created, io);
      return true;
    }

    case 'join_team_lobby': {
      if (teamLobby || store.getLobbyForPlayer(socketId)) {
        io.to(socketId).emit('message', {
          type: 'error',
          code: 'match_in_progress',
          message: 'Already in a lobby',
        });
        return true;
      }
      const joined = teamStore.joinLobby(raw.code, socketId, raw.name, raw.flagId);
      if (!joined) {
        io.to(socketId).emit('message', {
          type: 'error',
          code: 'invalid_code',
          message: 'Invalid team room code',
        });
        return true;
      }
      emitTeamLobby(teamStore, joined, io);
      return true;
    }

    case 'claim_team_slot': {
      if (!teamLobby || teamLobby.status !== 'waiting') return true;
      const ok = teamStore.claimSlot(teamLobby, socketId, raw.slot);
      if (!ok) {
        io.to(socketId).emit('message', {
          type: 'error',
          code: 'slot_taken',
          message: 'Slot unavailable',
        });
        return true;
      }
      emitTeamLobby(teamStore, teamLobby, io);
      return true;
    }

    case 'team_player_ready': {
      if (!teamLobby) return true;
      teamStore.setReady(teamLobby, socketId, raw.ready);
      emitTeamLobby(teamStore, teamLobby, io);
      return true;
    }

    case 'start_team_match': {
      if (!teamLobby || teamLobby.hostId !== socketId) {
        io.to(socketId).emit('message', {
          type: 'error',
          code: 'not_host',
          message: 'Only the host can start',
        });
        return true;
      }
      if (!teamStore.canStart(teamLobby)) {
        io.to(socketId).emit('message', {
          type: 'error',
          code: 'not_ready',
          message: 'All human slots must be filled and ready',
        });
        return true;
      }
      teamStore.beginMatch(teamLobby);
      startTeamTurn(teamStore, teamLobby, io, teamPickExpire(teamLobby));
      return true;
    }

    case 'submit_team_zone_pick': {
      if (!teamLobby || teamLobby.status !== 'playing' || !teamLobby.match) return true;
      if (!validateTeamZone(raw.zone, teamLobby.difficulty)) return true;

      const controllers = getActivePickControllers(teamStore, teamLobby);
      const isKicker = controllers.kickerSocket === socketId;
      const isKeeper = controllers.keeperSocket === socketId;

      if (isKicker) {
        if (teamLobby.match.pendingKickZone !== null) {
          io.to(socketId).emit('message', {
            type: 'error',
            code: 'double_submit',
            message: 'Pick already submitted',
          });
          return true;
        }
        teamLobby.match.pendingKickZone = raw.zone;
      } else if (isKeeper) {
        if (teamLobby.match.pendingKeepZone !== null) {
          io.to(socketId).emit('message', {
            type: 'error',
            code: 'double_submit',
            message: 'Pick already submitted',
          });
          return true;
        }
        teamLobby.match.pendingKeepZone = raw.zone;
      } else {
        io.to(socketId).emit('message', {
          type: 'error',
          code: 'not_your_turn',
          message: 'Not your turn',
        });
        return true;
      }

      fillAiPicks(teamStore, teamLobby);
      const msg = tryResolveTeamTurn(teamStore, teamLobby);
      if (msg) {
        emitTurnResultAndContinue(teamStore, teamLobby, io, msg, teamPickExpire(teamLobby));
      }
      return true;
    }

    case 'rematch_team': {
      if (!teamLobby || teamLobby.status !== 'finished') return true;
      teamStore.resetMatch(teamLobby);
      emitTeamLobby(teamStore, teamLobby, io);
      return true;
    }

    default:
      return true;
  }
}

io.on('connection', (socket) => {
  socket.on('message', (raw: ClientToServerMessage) => {
    if (handleTeamMessage(socket.id, raw)) return;

    const lobby = store.getLobbyForPlayer(socket.id);

    switch (raw.type) {
      case 'create_lobby': {
        if (lobby || teamStore.getLobbyForPlayer(socket.id)) {
          socket.emit('message', { type: 'error', code: 'match_in_progress', message: 'Already in a lobby' });
          return;
        }
        const created = store.createLobby(socket.id);
        socket.emit('message', lobbyStateMessage(created, true));
        break;
      }

      case 'join_lobby': {
        if (lobby || teamStore.getLobbyForPlayer(socket.id)) {
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
    const removedTeam = teamStore.removePlayer(socket.id);
    if (removedTeam) {
      if (removedTeam.hostId !== socket.id) {
        emitTeamLobby(teamStore, removedTeam, io);
        for (const member of removedTeam.members.values()) {
          io.to(member.socketId).emit('message', {
            type: 'opponent_disconnected',
            reconnectWindowMs: TEAM_RECONNECT_MS,
          });
        }
      }
      return;
    }

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

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Penalty Kings server listening on 0.0.0.0:${PORT}`);
});

