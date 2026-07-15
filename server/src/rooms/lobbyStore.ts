import { randomBytes } from 'node:crypto';
import {
  applyTurnToMatch as applyTurn,
  createOnlineMatchState as createMatch,
  keeperForKicker,
  PICK_CLOCK_SECONDS,
  roleForSide,
  type OnlineMatchState,
  type ServerToClientMessage,
  type MatchSide,
} from '@pk/shared';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const RECONNECT_WINDOW_MS = 30_000;

export type LobbyStatus = 'waiting' | 'playing' | 'finished';

export interface LobbyPlayer {
  id: string;
  ready: boolean;
}

export interface Lobby {
  code: string;
  host: LobbyPlayer;
  guest: LobbyPlayer | null;
  status: LobbyStatus;
  match: OnlineMatchState;
  pickTimer: ReturnType<typeof setTimeout> | null;
  disconnectTimer: ReturnType<typeof setTimeout> | null;
  disconnectedSide: MatchSide | null;
  createdAt: number;
}

export class LobbyStore {
  private lobbies = new Map<string, Lobby>();
  private playerLobby = new Map<string, string>();

  createLobby(hostId: string): Lobby {
    const code = this.generateCode();
    const lobby: Lobby = {
      code,
      host: { id: hostId, ready: false },
      guest: null,
      status: 'waiting',
      match: createMatch(),
      pickTimer: null,
      disconnectTimer: null,
      disconnectedSide: null,
      createdAt: Date.now(),
    };
    this.lobbies.set(code, lobby);
    this.playerLobby.set(hostId, code);
    return lobby;
  }

  joinLobby(code: string, guestId: string): Lobby | null {
    const lobby = this.lobbies.get(code.toUpperCase());
    if (!lobby || lobby.guest || lobby.status !== 'waiting') return null;
    lobby.guest = { id: guestId, ready: false };
    this.playerLobby.set(guestId, code.toUpperCase());
    return lobby;
  }

  getLobbyForPlayer(playerId: string): Lobby | null {
    const code = this.playerLobby.get(playerId);
    if (!code) return null;
    return this.lobbies.get(code) ?? null;
  }

  removePlayer(playerId: string): Lobby | null {
    const lobby = this.getLobbyForPlayer(playerId);
    if (!lobby) return null;
    this.playerLobby.delete(playerId);

    const isHost = lobby.host.id === playerId;
    const isGuest = lobby.guest?.id === playerId;

    if (isHost) {
      this.deleteLobby(lobby.code);
      return lobby;
    }

    if (isGuest) {
      lobby.guest = null;
      if (lobby.status === 'playing') {
        lobby.disconnectedSide = 'guest';
      }
    }
    return lobby;
  }

  deleteLobby(code: string): void {
    const lobby = this.lobbies.get(code);
    if (!lobby) return;
    if (lobby.pickTimer) clearTimeout(lobby.pickTimer);
    if (lobby.disconnectTimer) clearTimeout(lobby.disconnectTimer);
    this.playerLobby.delete(lobby.host.id);
    if (lobby.guest) this.playerLobby.delete(lobby.guest.id);
    this.lobbies.delete(code);
  }

  private generateCode(): string {
    let code = '';
    for (let i = 0; i < 5; i++) {
      const idx = randomBytes(1)[0]! % CODE_CHARS.length;
      code += CODE_CHARS[idx];
    }
    if (this.lobbies.has(code)) return this.generateCode();
    return code;
  }
}

export function lobbyStateMessage(lobby: Lobby, youAreHost: boolean): ServerToClientMessage {
  return {
    type: 'lobby_state',
    code: lobby.code,
    hostReady: lobby.host.ready,
    guestReady: lobby.guest?.ready ?? false,
    guestConnected: lobby.guest !== null,
    youAreHost,
  };
}

export function sideForPlayer(lobby: Lobby, playerId: string): MatchSide | null {
  if (lobby.host.id === playerId) return 'host';
  if (lobby.guest?.id === playerId) return 'guest';
  return null;
}

export { keeperForKicker as keeperForShooter };

export function clearPickTimer(lobby: Lobby): void {
  if (lobby.pickTimer) {
    clearTimeout(lobby.pickTimer);
    lobby.pickTimer = null;
  }
}

export function startPickTimer(lobby: Lobby, onExpire: () => void): void {
  clearPickTimer(lobby);
  lobby.pickTimer = setTimeout(onExpire, PICK_CLOCK_SECONDS * 1000);
}

export function tryResolveTurn(lobby: Lobby): ServerToClientMessage | null {
  const { match } = lobby;
  if (match.pendingKickZone === null || match.pendingKeepZone === null) return null;

  clearPickTimer(lobby);
  const result = applyTurn(match, match.pendingKickZone, match.pendingKeepZone);

  if (result.isComplete) {
    lobby.status = 'finished';
    return {
      type: 'match_end',
      score: result.score,
      winner: result.winner ?? 'draw',
    };
  }

  return {
    type: 'turn_result',
    round: result.round,
    kickZone: result.kickZone,
    keepZone: result.keepZone,
    point: result.point,
    score: result.score,
    kicker: result.kicker,
    nextKicker: result.nextKicker,
    isSuddenDeath: result.isSuddenDeath,
  };
}

export function matchStartMessage(lobby: Lobby, side: MatchSide): ServerToClientMessage {
  return {
    type: 'match_start',
    round: lobby.match.round,
    kicker: lobby.match.kicker,
    yourRole: roleForSide(side, lobby.match.kicker),
    score: { ...lobby.match.score },
  };
}

export const RECONNECT_MS = RECONNECT_WINDOW_MS;
