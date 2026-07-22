import type { Difficulty, DifficultyConfig, Dive, Shot, Zone } from '@pk/shared';
import {
  getDifficultyConfig,
  getZoneGridFromConfig,
  pickKeeperDive,
  pickShooterShot,
  zoneCount,
} from '@pk/shared';

export interface AiOpponent {
  pickDive: (shot: Shot, aimTell?: Shot['zone'] | null) => Dive;
  pickShot: () => Shot;
  pickZone: (role: 'shooter' | 'keeper') => Zone;
}

export function pickKickerZone(cfg: DifficultyConfig): Zone {
  const shot = pickShooterShot(cfg);
  return shot.zone;
}

export function pickKeeperZone(cfg: DifficultyConfig): Zone {
  const grid = getZoneGridFromConfig(cfg);
  const count = zoneCount(grid);
  if (Math.random() < cfg.saveChance * 0.5) {
    return Math.floor(Math.random() * count) as Zone;
  }
  return Math.floor(Math.random() * count) as Zone;
}

export function createAiOpponent(difficulty: Difficulty): AiOpponent {
  const cfg = getDifficultyConfig(difficulty);
  return createAiOpponentFromConfig(cfg);
}

export function createAiOpponentFromConfig(cfg: DifficultyConfig): AiOpponent {
  return {
    pickDive(shot: Shot, aimTell?: Shot['zone'] | null): Dive {
      return pickKeeperDive(shot, cfg, Math.random, { aimTell });
    },
    pickShot(): Shot {
      return pickShooterShot(cfg);
    },
    pickZone(role: 'shooter' | 'keeper'): Zone {
      return role === 'shooter' ? pickKickerZone(cfg) : pickKeeperZone(cfg);
    },
  };
}
