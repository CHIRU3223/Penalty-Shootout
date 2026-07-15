import type { DifficultyConfig, Dive, Outcome, Shot } from './types.js';
import { zoneDistance } from './types.js';

export type Rng = () => number;

const HIGH_POWER_THRESHOLD = 0.9;
const HIGH_POWER_MISS_CHANCE = 0.12;

/**
 * Pure outcome resolver shared by client prediction and authoritative server.
 * - Very high power may miss (wide/over).
 * - Otherwise SAVED if dive is within saveRadius and saveChance roll succeeds.
 * - Else GOAL.
 */
export function computeOutcome(
  shot: Shot,
  dive: Dive,
  cfg: DifficultyConfig,
  rng: Rng = Math.random,
): Outcome {
  if (shot.power > HIGH_POWER_THRESHOLD && rng() < HIGH_POWER_MISS_CHANCE) {
    return 'MISSED';
  }

  const dist = zoneDistance(shot.zone, dive.zone);
  if (dist <= cfg.saveRadius && rng() < cfg.saveChance) {
    return 'SAVED';
  }

  return 'GOAL';
}

export function isGoal(outcome: Outcome): boolean {
  return outcome === 'GOAL';
}
