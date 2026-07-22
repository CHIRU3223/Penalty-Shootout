import type { DifficultyConfig, Dive, Shot, Zone, ZoneGrid } from './types.js';
import {
  centerZone,
  rowColToZone,
  zoneCount,
  zoneToRowCol,
} from './types.js';
import { getZoneGridFromConfig } from './difficulty.js';
import type { Rng } from './scoring.js';

export interface AiKeeperContext {
  /** Visible aim zone hint (e.g. from opponent's aim indicator). */
  aimTell?: Zone | null;
}

function gridFromConfig(cfg: DifficultyConfig): ZoneGrid {
  return getZoneGridFromConfig(cfg);
}

function allZones(grid: ZoneGrid): Zone[] {
  return Array.from({ length: zoneCount(grid) }, (_, i) => i as Zone);
}

function cornerZones(grid: ZoneGrid): Zone[] {
  if (grid.rows === 1) {
    return [0, grid.cols - 1] as Zone[];
  }
  const lastRow = grid.rows - 1;
  const lastCol = grid.cols - 1;
  return [
    rowColToZone(0, 0, grid.cols),
    rowColToZone(0, lastCol, grid.cols),
    rowColToZone(lastRow, 0, grid.cols),
    rowColToZone(lastRow, lastCol, grid.cols),
  ];
}

function sideZones(grid: ZoneGrid): Zone[] {
  if (grid.rows === 1) {
    return grid.cols >= 3 ? [1 as Zone] : allZones(grid);
  }
  const midCol = Math.floor((grid.cols - 1) / 2);
  const out: Zone[] = [];
  for (let row = 0; row < grid.rows; row++) {
    out.push(rowColToZone(row, midCol, grid.cols));
  }
  return out;
}

function pickRandomZone(rng: Rng, grid: ZoneGrid): Zone {
  const zones = allZones(grid);
  return zones[Math.floor(rng() * zones.length)]!;
}

function neighborZones(zone: Zone, grid: ZoneGrid): Zone[] {
  const { row, col } = zoneToRowCol(zone, grid.cols);
  const out: Zone[] = [];
  for (let r = -1; r <= 1; r++) {
    for (let c = -1; c <= 1; c++) {
      const nr = row + r;
      const nc = col + c;
      if (nr >= 0 && nr < grid.rows && nc >= 0 && nc < grid.cols) {
        out.push(rowColToZone(nr, nc, grid.cols));
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
  const grid = gridFromConfig(cfg);
  let target = shot.zone;

  if (ctx.aimTell != null && rng() < cfg.shooterAccuracy * 0.85) {
    target = ctx.aimTell;
  } else if (rng() < cfg.saveChance) {
    target = shot.zone;
  } else {
    const pool = neighborZones(shot.zone, grid);
    target = pool[Math.floor(rng() * pool.length)] ?? pickRandomZone(rng, grid);
  }

  if (cfg.saveRadius > 0 && rng() > cfg.saveChance && rng() < 0.35) {
    const adj = neighborZones(target, grid).filter((z) => z !== shot.zone);
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
  const grid = gridFromConfig(cfg);
  const acc = cfg.shooterAccuracy;
  let zone: Zone;

  if (rng() < acc * 0.75) {
    const corners = cornerZones(grid);
    zone = corners[Math.floor(rng() * corners.length)]!;
  } else if (rng() < acc) {
    const sides = sideZones(grid);
    zone = sides[Math.floor(rng() * sides.length)]!;
  } else if (rng() < 0.5) {
    zone = centerZone(grid);
  } else {
    zone = pickRandomZone(rng, grid);
  }

  const powerBase = 0.35 + acc * 0.45;
  const power = Math.min(0.98, Math.max(0.3, powerBase + (rng() - 0.5) * 0.25));

  return { zone, power };
}

export function shouldAiReadAimTell(cfg: DifficultyConfig, rng: Rng = Math.random): boolean {
  return rng() < cfg.shooterAccuracy * (1 - cfg.reactionMs / 1000);
}
