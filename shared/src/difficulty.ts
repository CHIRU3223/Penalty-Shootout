import type { Difficulty, DifficultyConfig, ZoneGrid } from './types.js';

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  beginner: {
    zoneRows: 1,
    zoneCols: 3,
    saveChance: 0.2,
    saveRadius: 0,
    reactionMs: 600,
    shooterAccuracy: 0.35,
  },
  intermediate: {
    zoneRows: 2,
    zoneCols: 3,
    saveChance: 0.45,
    saveRadius: 1,
    reactionMs: 400,
    shooterAccuracy: 0.6,
  },
  pro: {
    zoneRows: 3,
    zoneCols: 3,
    saveChance: 0.7,
    saveRadius: 1,
    reactionMs: 200,
    shooterAccuracy: 0.85,
  },
};

export function getDifficultyConfig(difficulty: Difficulty): DifficultyConfig {
  return DIFFICULTIES[difficulty];
}

export function getZoneGrid(difficulty: Difficulty): ZoneGrid {
  const cfg = getDifficultyConfig(difficulty);
  return { rows: cfg.zoneRows, cols: cfg.zoneCols };
}

export function getZoneGridFromConfig(cfg: DifficultyConfig): ZoneGrid {
  return { rows: cfg.zoneRows, cols: cfg.zoneCols };
}
