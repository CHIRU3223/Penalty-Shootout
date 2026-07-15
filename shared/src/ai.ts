import type { DifficultyConfig, Dive, Shot, Zone } from './types.js';
import { rowColToZone, zoneToRowCol } from './types.js';
import type { Rng } from './scoring.js';

const CORNER_ZONES: Zone[] = [0, 2, 6, 8];
const SIDE_ZONES: Zone[] = [1, 3, 5, 7];
const ALL_ZONES: Zone[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export interface AiKeeperContext {
  /** Visible aim zone hint (e.g. from opponent's aim indicator). */
  aimTell?: Zone | null;
}

function pickRandomZone(rng: Rng): Zone {
  return ALL_ZONES[Math.floor(rng() * ALL_ZONES.length)]!;
}

function neighborZones(zone: Zone): Zone[] {
  const { row, col } = zoneToRowCol(zone);
  const out: Zone[] = [];
  for (let r = -1; r <= 1; r++) {
    for (let c = -1; c <= 1; c++) {
      const nr = row + r;
      const nc = col + c;
      if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3) {
        out.push(rowColToZone(nr, nc));
      }
    }
  }
  return out;
}

/**
 * AI keeper dive — configurable via DifficultyConfig.
 * saveChance ~= correct-zone guess rate; saveRadius allows adjacent coverage.
 */
export function pickKeeperDive(
  shot: Shot,
  cfg: DifficultyConfig,
  rng: Rng = Math.random,
  ctx: AiKeeperContext = {},
): Dive {
  let target = shot.zone;

  if (ctx.aimTell != null && rng() < cfg.shooterAccuracy * 0.85) {
    target = ctx.aimTell;
  } else if (rng() < cfg.saveChance) {
    target = shot.zone;
  } else {
    const pool = neighborZones(shot.zone);
    target = pool[Math.floor(rng() * pool.length)] ?? pickRandomZone(rng);
  }

  if (cfg.saveRadius > 0 && rng() > cfg.saveChance && rng() < 0.35) {
    const adj = neighborZones(target).filter((z) => z !== shot.zone);
    if (adj.length > 0) {
      target = adj[Math.floor(rng() * adj.length)]!;
    }
  }

  return { zone: target };
}

/**
 * AI shooter placement + power.
 * shooterAccuracy drives corner preference and power consistency.
 */
export function pickShooterShot(cfg: DifficultyConfig, rng: Rng = Math.random): Shot {
  const acc = cfg.shooterAccuracy;
  let zone: Zone;

  if (rng() < acc * 0.75) {
    zone = CORNER_ZONES[Math.floor(rng() * CORNER_ZONES.length)]!;
  } else if (rng() < acc) {
    zone = SIDE_ZONES[Math.floor(rng() * SIDE_ZONES.length)]!;
  } else if (rng() < 0.5) {
    zone = 4;
  } else {
    zone = pickRandomZone(rng);
  }

  const powerBase = 0.35 + acc * 0.45;
  const power = Math.min(0.98, Math.max(0.3, powerBase + (rng() - 0.5) * 0.25));

  return { zone, power };
}

export function shouldAiReadAimTell(cfg: DifficultyConfig, rng: Rng = Math.random): boolean {
  return rng() < cfg.shooterAccuracy * (1 - cfg.reactionMs / 1000);
}
