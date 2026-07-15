import type { Difficulty, DifficultyConfig } from './types.js';

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  beginner: {
    saveChance: 0.2,
    saveRadius: 0,
    reactionMs: 600,
    shooterAccuracy: 0.35,
  },
  intermediate: {
    saveChance: 0.45,
    saveRadius: 1,
    reactionMs: 400,
    shooterAccuracy: 0.6,
  },
  pro: {
    saveChance: 0.7,
    saveRadius: 1,
    reactionMs: 200,
    shooterAccuracy: 0.85,
  },
};

export function getDifficultyConfig(difficulty: Difficulty): DifficultyConfig {
  return DIFFICULTIES[difficulty];
}
