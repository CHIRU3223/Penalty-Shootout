import { describe, expect, it } from 'vitest';
import { pickKeeperDive, pickShooterShot } from './ai.js';
import { DIFFICULTIES } from './difficulty.js';
import type { Zone } from './types.js';

const always = (value: number) => () => value;

describe('pickKeeperDive', () => {
  it('beginner dives to correct zone ~20% with fixed rng', () => {
    const dive = pickKeeperDive(
      { zone: 4 as Zone, power: 0.6 },
      DIFFICULTIES.beginner,
      always(0.1),
    );
    expect(dive.zone).toBe(4);
  });

  it('beginner misses correct zone with high rng', () => {
    const dive = pickKeeperDive(
      { zone: 4 as Zone, power: 0.6 },
      DIFFICULTIES.beginner,
      always(0.95),
    );
    expect(dive.zone).not.toBe(4);
  });

  it('pro reads aim tell when provided', () => {
    const dive = pickKeeperDive(
      { zone: 0 as Zone, power: 0.8 },
      DIFFICULTIES.pro,
      always(0.1),
      { aimTell: 8 as Zone },
    );
    expect(dive.zone).toBe(8);
  });
});

describe('pickShooterShot', () => {
  it('beginner tends toward lower power', () => {
    const shot = pickShooterShot(DIFFICULTIES.beginner, always(0.5));
    expect(shot.power).toBeLessThan(0.7);
  });

  it('pro picks valid zone and decent power', () => {
    const shot = pickShooterShot(DIFFICULTIES.pro, always(0.05));
    expect(shot.zone).toBeGreaterThanOrEqual(0);
    expect(shot.zone).toBeLessThanOrEqual(8);
    expect(shot.power).toBeGreaterThan(0.5);
  });
});
