import type { Zone } from './types.js';

export type DuelWinner = 'kicker' | 'keeper';

/**
 * Zone duel scoring:
 * - Same zone → keeper gets the point
 * - Different zone → kicker gets the point
 */
export function computeZoneDuel(kickZone: Zone, keepZone: Zone): DuelWinner {
  return kickZone === keepZone ? 'keeper' : 'kicker';
}

export function duelPointLabel(winner: DuelWinner): 'KICKER_POINT' | 'KEEPER_POINT' {
  return winner === 'kicker' ? 'KICKER_POINT' : 'KEEPER_POINT';
}
