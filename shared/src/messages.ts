import type { Difficulty, DuelPoint, PlayerProfile, Zone, ZoneGrid } from './types.js';
import { isValidZone, PRO_ZONE_GRID } from './types.js';
import type { MatchSide } from './matchEngine.js';
import type { TeamSide } from './teamEngine.js';

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

export interface TeamLobbySlotPayload {
  slot: number;
  name: string;
  flagId: string;
  isAi: boolean;
}

export interface CreateTeamLobbyMessage {
  type: 'create_team_lobby';
  teamNameA: string;
  teamNameB: string;
  slots: TeamLobbySlotPayload[];
  difficulty: Difficulty;
}

export interface JoinTeamLobbyMessage {
  type: 'join_team_lobby';
  code: string;
  name: string;
  flagId: string;
}

export interface ClaimTeamSlotMessage {
  type: 'claim_team_slot';
  slot: number;
}

export interface TeamPlayerReadyMessage {
  type: 'team_player_ready';
  ready: boolean;
}

export interface StartTeamMatchMessage {
  type: 'start_team_match';
}

export interface SubmitTeamZonePickMessage {
  type: 'submit_team_zone_pick';
  zone: Zone;
}

export interface RematchTeamMessage {
  type: 'rematch_team';
}

export type ClientToServerMessage =
  | CreateLobbyMessage
  | JoinLobbyMessage
  | PlayerReadyMessage
  | StartMatchMessage
  | SubmitZonePickMessage
  | RematchMessage
  | CreateTeamLobbyMessage
  | JoinTeamLobbyMessage
  | ClaimTeamSlotMessage
  | TeamPlayerReadyMessage
  | StartTeamMatchMessage
  | SubmitTeamZonePickMessage
  | RematchTeamMessage;

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

export interface TeamLobbySlotState {
  slot: number;
  name: string;
  flagId: string;
  isAi: boolean;
  playerConnected: boolean;
  ready: boolean;
}

export interface TeamLobbyStateMessage {
  type: 'team_lobby_state';
  code: string;
  teamNameA: string;
  teamNameB: string;
  slots: TeamLobbySlotState[];
  youAreHost: boolean;
  yourSlot: number | null;
  canStart: boolean;
  difficulty: Difficulty;
}

export interface TeamTurnStartMessage {
  type: 'team_turn_start';
  turnIndex: number;
  totalTurns: number;
  leg: 'first' | 'second';
  teamAScore: number;
  teamBScore: number;
  teamNameA: string;
  teamNameB: string;
  activeKicker: PlayerProfile;
  activeKeeper: PlayerProfile;
  yourRole: 'shooter' | 'keeper' | 'spectator';
}

export interface TeamTurnResultMessage {
  type: 'team_turn_result';
  turnIndex: number;
  kickZone: Zone;
  keepZone: Zone;
  point: DuelPoint;
  teamAScore: number;
  teamBScore: number;
  nextTurn: Omit<TeamTurnStartMessage, 'type'> | null;
}

export interface TeamMatchEndMessage {
  type: 'team_match_end';
  teamAScore: number;
  teamBScore: number;
  winner: TeamSide | 'draw';
  teamNameA: string;
  teamNameB: string;
}

export interface ErrorMessage {
  type: 'error';
  code:
    | 'lobby_full'
    | 'invalid_code'
    | 'double_submit'
    | 'not_your_turn'
    | 'not_ready'
    | 'match_in_progress'
    | 'slot_taken'
    | 'slot_invalid'
    | 'not_host';
  message: string;
}

export type ServerToClientMessage =
  | LobbyStateMessage
  | MatchStartMessage
  | TurnResultMessage
  | MatchEndMessage
  | OpponentDisconnectedMessage
  | TeamLobbyStateMessage
  | TeamTurnStartMessage
  | TeamTurnResultMessage
  | TeamMatchEndMessage
  | ErrorMessage;

export type SocketMessage = ClientToServerMessage | ServerToClientMessage;

export function isClientMessage(msg: SocketMessage): msg is ClientToServerMessage {
  return (
    msg.type === 'create_lobby' ||
    msg.type === 'join_lobby' ||
    msg.type === 'player_ready' ||
    msg.type === 'start_match' ||
    msg.type === 'submit_zone_pick' ||
    msg.type === 'rematch' ||
    msg.type === 'create_team_lobby' ||
    msg.type === 'join_team_lobby' ||
    msg.type === 'claim_team_slot' ||
    msg.type === 'team_player_ready' ||
    msg.type === 'start_team_match' ||
    msg.type === 'submit_team_zone_pick' ||
    msg.type === 'rematch_team'
  );
}

export function zoneFromPayload(zone: number, grid: ZoneGrid = PRO_ZONE_GRID): Zone | null {
  if (isValidZone(zone, grid)) {
    return zone;
  }
  return null;
}

export type { MatchScore } from './types.js';
