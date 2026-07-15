import type { DuelPoint, MatchScore, PlayerRole, Zone } from './types.js';
import { MAX_ROUNDS } from './types.js';
import { computeZoneDuel } from './duel.js';

export type MatchSide = 'host' | 'guest';

export interface OnlineScore {
  host: number;
  guest: number;
}

export interface TurnResultPayload {
  round: number;
  kickZone: Zone;
  keepZone: Zone;
  point: DuelPoint;
  score: OnlineScore;
  kicker: MatchSide;
  isSuddenDeath: boolean;
  isComplete: boolean;
  winner: MatchSide | 'draw' | null;
  nextKicker: MatchSide | null;
}

export interface OnlineMatchState {
  round: number;
  score: OnlineScore;
  kicker: MatchSide;
  isSuddenDeath: boolean;
  isComplete: boolean;
  winner: MatchSide | 'draw' | null;
  sdPairHostKickerWin: boolean | null;
  sdPairGuestKickerWin: boolean | null;
  pendingKickZone: Zone | null;
  pendingKeepZone: Zone | null;
}

export function createOnlineMatchState(): OnlineMatchState {
  return {
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
}

export function roleForSide(side: MatchSide, kicker: MatchSide): PlayerRole {
  return side === kicker ? 'shooter' : 'keeper';
}

export function keeperForKicker(kicker: MatchSide): MatchSide {
  return kicker === 'host' ? 'guest' : 'host';
}

export function scoreForClient(side: MatchSide, score: OnlineScore): MatchScore {
  return side === 'host'
    ? { player: score.host, opponent: score.guest }
    : { player: score.guest, opponent: score.host };
}

export function applyTurnToMatch(
  state: OnlineMatchState,
  kickZone: Zone,
  keepZone: Zone,
): TurnResultPayload {
  const duelWinner = computeZoneDuel(kickZone, keepZone);
  const kickerScored = duelWinner === 'kicker';
  const kickingSide = state.kicker;

  if (state.isSuddenDeath) {
    if (kickingSide === 'host') state.sdPairHostKickerWin = kickerScored;
    else state.sdPairGuestKickerWin = kickerScored;
  } else if (kickerScored) {
    if (kickingSide === 'host') state.score.host += 1;
    else state.score.guest += 1;
  }

  const point: DuelPoint = kickerScored ? 'KICKER_POINT' : 'KEEPER_POINT';

  const result: TurnResultPayload = {
    round: state.round,
    kickZone,
    keepZone,
    point,
    score: { ...state.score },
    kicker: kickingSide,
    isSuddenDeath: state.isSuddenDeath,
    isComplete: false,
    winner: null,
    nextKicker: null,
  };

  state.pendingKickZone = null;
  state.pendingKeepZone = null;

  if (!state.isSuddenDeath) {
    const remaining = MAX_ROUNDS - state.round;
    const hostLead = state.score.host - state.score.guest;
    const guestLead = state.score.guest - state.score.host;
    if (hostLead > remaining || guestLead > remaining) {
      finishOnlineMatch(state);
      result.isComplete = true;
      result.winner = state.winner;
      return result;
    }
  }

  advanceOnlineTurn(state);
  result.nextKicker = state.isComplete ? null : state.kicker;
  result.isComplete = state.isComplete;
  result.winner = state.winner;
  result.isSuddenDeath = state.isSuddenDeath;
  return result;
}

function advanceOnlineTurn(state: OnlineMatchState): void {
  if (state.isComplete) return;

  if (!state.isSuddenDeath) {
    state.round += 1;
    if (state.round > MAX_ROUNDS) {
      if (state.score.host === state.score.guest) {
        state.isSuddenDeath = true;
        state.round = MAX_ROUNDS + 1;
      } else {
        finishOnlineMatch(state);
        return;
      }
    }
  } else {
    state.round += 1;
    if (state.sdPairHostKickerWin !== null && state.sdPairGuestKickerWin !== null) {
      const hostSdWin = state.sdPairHostKickerWin && !state.sdPairGuestKickerWin;
      const guestSdWin = state.sdPairGuestKickerWin && !state.sdPairHostKickerWin;
      if (hostSdWin || guestSdWin) {
        if (hostSdWin) state.score.host += 1;
        if (guestSdWin) state.score.guest += 1;
        finishOnlineMatch(state);
        return;
      }
      state.sdPairHostKickerWin = null;
      state.sdPairGuestKickerWin = null;
    }
  }

  state.kicker = state.kicker === 'host' ? 'guest' : 'host';
}

function finishOnlineMatch(state: OnlineMatchState): void {
  state.isComplete = true;
  if (state.score.host > state.score.guest) state.winner = 'host';
  else if (state.score.guest > state.score.host) state.winner = 'guest';
  else state.winner = 'draw';
}

export function winnerForClient(
  side: MatchSide,
  winner: MatchSide | 'draw' | null,
): 'player' | 'opponent' | 'draw' | null {
  if (winner === 'draw') return 'draw';
  if (winner === null) return null;
  return winner === side ? 'player' : 'opponent';
}
