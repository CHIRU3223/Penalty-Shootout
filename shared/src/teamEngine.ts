import type { Difficulty, DuelPoint, PlayerProfile, PlayerRole, Zone } from './types.js';
import {
  TEAM_KEEPS_PER_PLAYER,
  TEAM_KICKS_PER_PLAYER,
} from './types.js';
import { computeZoneDuel } from './duel.js';
import { getDifficultyConfig } from './difficulty.js';
import { pickKeeperDive, pickShooterShot } from './ai.js';

export type TeamSide = 'A' | 'B';

export interface TeamTurnSpec {
  kickerTeam: TeamSide;
  slot: number;
  leg: 'first' | 'second';
  duelType: 'kick' | 'keep';
}

export interface TeamTurnPairing {
  turn: TeamTurnSpec;
  kicker: PlayerProfile;
  keeper: PlayerProfile;
  teamAControls: 'kicker' | 'keeper' | null;
}

export interface TeamMatchState {
  turnOrder: TeamTurnSpec[];
  turnIndex: number;
  teamAScore: number;
  teamBScore: number;
  pendingKickZone: Zone | null;
  pendingKeepZone: Zone | null;
  isComplete: boolean;
  winner: TeamSide | 'draw' | null;
}

export interface TeamTurnResult {
  turnIndex: number;
  kickZone: Zone;
  keepZone: Zone;
  point: DuelPoint;
  teamAScore: number;
  teamBScore: number;
  isComplete: boolean;
  winner: TeamSide | 'draw' | null;
}

export function buildTeamTurnOrder(teamSize: number): TeamTurnSpec[] {
  const turns: TeamTurnSpec[] = [];

  const addLeg = (leg: 'first' | 'second', attackingTeam: TeamSide) => {
    for (let slot = 0; slot < teamSize; slot++) {
      for (let i = 0; i < TEAM_KICKS_PER_PLAYER; i++) {
        turns.push({ kickerTeam: attackingTeam, slot, leg, duelType: 'kick' });
      }
      const defendingTeam: TeamSide = attackingTeam === 'A' ? 'B' : 'A';
      for (let i = 0; i < TEAM_KEEPS_PER_PLAYER; i++) {
        turns.push({ kickerTeam: defendingTeam, slot, leg, duelType: 'keep' });
      }
    }
  };

  addLeg('first', 'A');
  addLeg('second', 'B');
  return turns;
}

export function createTeamMatchState(teamSize: number): TeamMatchState {
  return {
    turnOrder: buildTeamTurnOrder(teamSize),
    turnIndex: 0,
    teamAScore: 0,
    teamBScore: 0,
    pendingKickZone: null,
    pendingKeepZone: null,
    isComplete: false,
    winner: null,
  };
}

export function getTeamTurnPairing(
  state: TeamMatchState,
  teamA: PlayerProfile[],
  teamB: PlayerProfile[],
): TeamTurnPairing | null {
  const turn = state.turnOrder[state.turnIndex];
  if (!turn) return null;

  const kickerTeam = turn.kickerTeam;
  const keeperTeam: TeamSide = kickerTeam === 'A' ? 'B' : 'A';
  const kicker = (kickerTeam === 'A' ? teamA : teamB)[turn.slot]!;
  const keeper = (keeperTeam === 'A' ? teamA : teamB)[turn.slot]!;
  const teamAControls: 'kicker' | 'keeper' | null =
    kickerTeam === 'A' ? 'kicker' : keeperTeam === 'A' ? 'keeper' : null;

  return { turn, kicker, keeper, teamAControls };
}

export function pickAiZone(difficulty: Difficulty, role: PlayerRole): Zone {
  const cfg = getDifficultyConfig(difficulty);
  if (role === 'shooter') {
    return pickShooterShot(cfg).zone;
  }
  const fakeShot = pickShooterShot(cfg);
  return pickKeeperDive(fakeShot, cfg).zone;
}

export function applyTeamTurn(
  state: TeamMatchState,
  kickZone: Zone,
  keepZone: Zone,
): TeamTurnResult {
  const pairing = state.turnOrder[state.turnIndex];
  if (!pairing) {
    return {
      turnIndex: state.turnIndex,
      kickZone,
      keepZone,
      point: 'KEEPER_POINT',
      teamAScore: state.teamAScore,
      teamBScore: state.teamBScore,
      isComplete: true,
      winner: state.winner,
    };
  }

  const duelWinner = computeZoneDuel(kickZone, keepZone);
  const kickerScored = duelWinner === 'kicker';
  const kickerTeam = pairing.kickerTeam;

  if (kickerTeam === 'A') {
    if (kickerScored) state.teamAScore += 1;
    else state.teamBScore += 1;
  } else if (kickerScored) {
    state.teamBScore += 1;
  } else {
    state.teamAScore += 1;
  }

  const point: DuelPoint = kickerScored ? 'KICKER_POINT' : 'KEEPER_POINT';
  state.pendingKickZone = null;
  state.pendingKeepZone = null;
  state.turnIndex += 1;

  if (state.turnIndex >= state.turnOrder.length) {
    state.isComplete = true;
    if (state.teamAScore > state.teamBScore) state.winner = 'A';
    else if (state.teamBScore > state.teamAScore) state.winner = 'B';
    else state.winner = 'draw';
  }

  return {
    turnIndex: state.turnIndex,
    kickZone,
    keepZone,
    point,
    teamAScore: state.teamAScore,
    teamBScore: state.teamBScore,
    isComplete: state.isComplete,
    winner: state.winner,
  };
}

export function teamWinnerForClient(
  winner: TeamSide | 'draw' | null,
): 'player' | 'opponent' | 'draw' | null {
  if (winner === 'draw') return 'draw';
  if (winner === null) return null;
  return winner === 'A' ? 'player' : 'opponent';
}
