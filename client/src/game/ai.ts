import type { Difficulty, DifficultyConfig, Dive, Shot, Zone } from '@pk/shared';
import { getDifficultyConfig, pickKeeperDive, pickShooterShot } from '@pk/shared';

export interface AiOpponent {
  pickDive: (shot: Shot, aimTell?: Shot['zone'] | null) => Dive;
  pickShot: () => Shot;
  pickZone: (role: 'shooter' | 'keeper') => Zone;
}

const CORNER_ZONES: Zone[] = [0, 2, 6, 8];

export function pickKickerZone(cfg: DifficultyConfig): Zone {
  const shot = pickShooterShot(cfg);
  return shot.zone;
}

export function pickKeeperZone(cfg: DifficultyConfig): Zone {
  if (Math.random() < cfg.saveChance * 0.5) {
    return CORNER_ZONES[Math.floor(Math.random() * CORNER_ZONES.length)]!;
  }
  return Math.floor(Math.random() * 9) as Zone;
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
