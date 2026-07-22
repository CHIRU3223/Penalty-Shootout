import { describe, expect, it } from 'vitest';
import { pickKeeperDive, pickShooterShot } from './ai.js';
import { DIFFICULTIES, getZoneGridFromConfig } from './difficulty.js';
import { centerZone, type Zone } from './types.js';

const always = (value: number) => () => value;

describe('pickKeeperDive', () => {
  it('beginner dives to correct zone ~20% with fixed rng', () => {
    const grid = getZoneGridFromConfig(DIFFICULTIES.beginner);
    const target = centerZone(grid);
    const dive = pickKeeperDive(
      { zone: target, power: 0.6 },
      DIFFICULTIES.beginner,
      always(0.1),
    );
    expect(dive.zone).toBe(target);
  });

  it('beginner misses correct zone with high rng', () => {
    const grid = getZoneGridFromConfig(DIFFICULTIES.beginner);
    const target = centerZone(grid);
    const dive = pickKeeperDive(
      { zone: target, power: 0.6 },
      DIFFICULTIES.beginner,
      always(0.95),
    );
    expect(dive.zone).not.toBe(target);
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

  it('beginner picks within 3-zone grid', () => {
    const shot = pickShooterShot(DIFFICULTIES.beginner, always(0.5));
    expect(shot.zone).toBeGreaterThanOrEqual(0);
    expect(shot.zone).toBeLessThanOrEqual(2);
  });

  it('pro picks valid zone and decent power', () => {
    const shot = pickShooterShot(DIFFICULTIES.pro, always(0.05));
    expect(shot.zone).toBeGreaterThanOrEqual(0);
    expect(shot.zone).toBeLessThanOrEqual(8);
    expect(shot.power).toBeGreaterThan(0.5);
  });
});
