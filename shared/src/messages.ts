import type { DuelPoint, Zone } from './types.js';
import type { MatchSide } from './matchEngine.js';

/** Client -> Server */
export interface CreateLobbyMessage {
  type: 'create_lobby';
}

export interface JoinLobbyMessage {
  type: 'join_lobby';
  code: string;
}

export interface PlayerReadyMessage {
  type: 'player_ready';
  ready: boolean;
}

export interface StartMatchMessage {
  type: 'start_match';
}

export interface SubmitZonePickMessage {
  type: 'submit_zone_pick';
  zone: Zone;
}

export interface RematchMessage {
  type: 'rematch';
}

export type ClientToServerMessage =
  | CreateLobbyMessage
  | JoinLobbyMessage
  | PlayerReadyMessage
  | StartMatchMessage
  | SubmitZonePickMessage
  | RematchMessage;

/** Server -> Client */
export interface LobbyStateMessage {
  type: 'lobby_state';
  code: string;
  hostReady: boolean;
  guestReady: boolean;
  guestConnected: boolean;
  youAreHost: boolean;
}

export interface MatchStartMessage {
  type: 'match_start';
  round: number;
  kicker: MatchSide;
  yourRole: 'shooter' | 'keeper';
  score: { host: number; guest: number };
}

export interface TurnResultMessage {
  type: 'turn_result';
  round: number;
  kickZone: Zone;
  keepZone: Zone;
  point: DuelPoint;
  score: { host: number; guest: number };
  kicker: MatchSide;
  nextKicker: MatchSide | null;
  isSuddenDeath: boolean;
}

export interface MatchEndMessage {
  type: 'match_end';
  score: { host: number; guest: number };
  winner: MatchSide | 'draw';
}

export interface OpponentDisconnectedMessage {
  type: 'opponent_disconnected';
  reconnectWindowMs: number;
}

export interface ErrorMessage {
  type: 'error';
  code:
    | 'lobby_full'
    | 'invalid_code'
    | 'double_submit'
    | 'not_your_turn'
    | 'not_ready'
    | 'match_in_progress';
  message: string;
}

export type ServerToClientMessage =
  | LobbyStateMessage
  | MatchStartMessage
  | TurnResultMessage
  | MatchEndMessage
  | OpponentDisconnectedMessage
  | ErrorMessage;

export type SocketMessage = ClientToServerMessage | ServerToClientMessage;

export function isClientMessage(msg: SocketMessage): msg is ClientToServerMessage {
  return (
    msg.type === 'create_lobby' ||
    msg.type === 'join_lobby' ||
    msg.type === 'player_ready' ||
    msg.type === 'start_match' ||
    msg.type === 'submit_zone_pick' ||
    msg.type === 'rematch'
  );
}

export function zoneFromPayload(zone: number): Zone | null {
  if (Number.isInteger(zone) && zone >= 0 && zone <= 8) {
    return zone as Zone;
  }
  return null;
}

export type { MatchScore } from './types.js';
