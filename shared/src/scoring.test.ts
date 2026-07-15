import { describe, expect, it } from 'vitest';
import { computeOutcome } from './scoring.js';
import { DIFFICULTIES } from './difficulty.js';
import type { Zone } from './types.js';

const always = (value: number) => () => value;

describe('computeOutcome', () => {
  it('returns GOAL when dive is out of save radius', () => {
    const outcome = computeOutcome(
      { zone: 0 as Zone, power: 0.7 },
      { zone: 8 as Zone },
      DIFFICULTIES.beginner,
      always(0.5),
    );
    expect(outcome).toBe('GOAL');
  });

  it('returns SAVED when in radius and save roll succeeds', () => {
    const outcome = computeOutcome(
      { zone: 4 as Zone, power: 0.7 },
      { zone: 4 as Zone },
      DIFFICULTIES.intermediate,
      always(0.1),
    );
    expect(outcome).toBe('SAVED');
  });

  it('returns GOAL when in radius but save roll fails', () => {
    const outcome = computeOutcome(
      { zone: 4 as Zone, power: 0.7 },
      { zone: 4 as Zone },
      DIFFICULTIES.intermediate,
      always(0.99),
    );
    expect(outcome).toBe('GOAL');
  });

  it('returns MISSED on high power miss roll', () => {
    const outcome = computeOutcome(
      { zone: 4 as Zone, power: 0.95 },
      { zone: 4 as Zone },
      DIFFICULTIES.pro,
      always(0.0),
    );
    expect(outcome).toBe('MISSED');
  });
});
