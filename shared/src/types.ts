/** 3x3 grid zone index (0-8), row-major: top-left=0, bottom-right=8 */
export type Zone = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** Legacy outcomes — kept for backward compat */
export type Outcome = 'GOAL' | 'SAVED' | 'MISSED';

/** New zone-duel outcome: who gets the point this round */
export type DuelPoint = 'KICKER_POINT' | 'KEEPER_POINT';

export type PlayerRole = 'shooter' | 'keeper';

export type Difficulty = 'beginner' | 'intermediate' | 'pro';

export type MatchFormat = 'duel' | 'classic';

export type TeamId = 'A' | 'B';

export interface Shot {
  zone: Zone;
  power: number;
}

export interface Dive {
  zone: Zone;
}

export interface ZonePick {
  zone: Zone;
}

export interface DifficultyConfig {
  saveChance: number;
  saveRadius: number;
  reactionMs: number;
  shooterAccuracy: number;
}

export interface PlayerProfile {
  id: string;
  name: string;
  flagId: string;
}

export interface PlayerStats {
  matchesPlayed: number;
  matchesWon: number;
  kickerPoints: number;
  keeperPoints: number;
  teamWins: number;
}

export interface TeamRoster {
  teamId: TeamId;
  players: PlayerProfile[];
}

export interface RoundResult {
  round: number;
  kickerName: string;
  keeperName: string;
  kickZone: Zone;
  keepZone: Zone;
  point: DuelPoint;
}

export interface MatchScore {
  player: number;
  opponent: number;
}

export interface TeamScore {
  A: number;
  B: number;
}

export interface MatchState {
  round: number;
  maxRounds: number;
  score: MatchScore;
  playerRole: PlayerRole;
  isSuddenDeath: boolean;
  isComplete: boolean;
  winner: 'player' | 'opponent' | 'draw' | null;
  history: RoundResult[];
}

export const ZONE_ROWS = 3;
export const ZONE_COLS = 3;
/** Kicks (or keeps) per side in 1v1 / online — 5 each = 10 duels total */
export const ROUNDS_PER_ROLE = 5;
export const MAX_DUELS = ROUNDS_PER_ROLE * 2;
/** @deprecated use MAX_DUELS */
export const MAX_ROUNDS = MAX_DUELS;
export const SHOT_CLOCK_SECONDS = 8;
export const PICK_CLOCK_SECONDS = 10;
export const TEAM_KICKS_PER_PLAYER = 2;
export const TEAM_KEEPS_PER_PLAYER = 2;
export const MIN_TEAM_PLAYERS = 1;
export const MAX_TEAM_PLAYERS = 8;
export const DEFAULT_TEAM_PLAYERS = 3;
/** @deprecated use DEFAULT_TEAM_PLAYERS */
export const DEFAULT_TEAM_SIZE = DEFAULT_TEAM_PLAYERS;

export function zoneToRowCol(zone: Zone): { row: number; col: number } {
  return { row: Math.floor(zone / ZONE_COLS), col: zone % ZONE_COLS };
}

export function rowColToZone(row: number, col: number): Zone {
  return (row * ZONE_COLS + col) as Zone;
}

/** Chebyshev (king's move) distance on the 3x3 grid */
export function zoneDistance(a: Zone, b: Zone): number {
  const pa = zoneToRowCol(a);
  const pb = zoneToRowCol(b);
  return Math.max(Math.abs(pa.row - pb.row), Math.abs(pa.col - pb.col));
}
