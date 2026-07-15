import { describe, expect, it } from 'vitest';
import { computeZoneDuel, duelPointLabel } from './duel.js';

describe('computeZoneDuel', () => {
  it('keeper wins when zones match', () => {
    expect(computeZoneDuel(4, 4)).toBe('keeper');
    expect(duelPointLabel(computeZoneDuel(0, 0))).toBe('KEEPER_POINT');
  });

  it('kicker wins when zones differ', () => {
    expect(computeZoneDuel(0, 8)).toBe('kicker');
    expect(duelPointLabel(computeZoneDuel(3, 5))).toBe('KICKER_POINT');
  });
});
