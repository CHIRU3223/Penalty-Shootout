# Scoring Rules

Authoritative outcome logic in `shared/src/scoring.ts`.

## Function

```typescript
computeOutcome(shot: Shot, dive: Dive, cfg: DifficultyConfig, rng?: Rng): Outcome
```

Returns one of: `'GOAL'` | `'SAVED'` | `'MISSED'`

## Decision tree

```
1. shot.power > 0.9 AND rng() < 0.12?
   → MISSED (ball goes wide/over)

2. zoneDistance(shot.zone, dive.zone) <= cfg.saveRadius
   AND rng() < cfg.saveChance?
   → SAVED

3. Otherwise
   → GOAL
```

## Goal zones (3×3 grid)

```
┌───┬───┬───┐
│ 0 │ 1 │ 2 │   top
├───┼───┼───┤
│ 3 │ 4 │ 5 │   middle
├───┼───┼───┤
│ 6 │ 7 │ 8 │   bottom
└───┴───┴───┘
   L   C   R
```

Row-major indexing: `zone = row * 3 + col`

## Zone distance

Chebyshev (king's move) distance on the grid:

```
distance(0, 8) = 2
distance(4, 5) = 1
distance(4, 4) = 0
```

`saveRadius = 1` means keeper can save shots in adjacent zones (including diagonals).

## High power miss

| Threshold | Miss chance |
|-----------|-------------|
| `power > 0.9` | 12% (`HIGH_POWER_MISS_CHANCE`) |

Represents shots blasted wide or over the bar.

## Save logic

A save requires **both**:
1. Dive zone within `saveRadius` of shot zone
2. Random roll succeeds (`rng() < saveChance`)

If in radius but roll fails → **GOAL** (keeper got a hand on it but couldn't hold).

## Examples

### Easy save (Intermediate)
```typescript
shot = { zone: 4, power: 0.6 }
dive = { zone: 4 }
cfg  = DIFFICULTIES.intermediate  // saveChance: 0.45, saveRadius: 1
rng  = () => 0.1  // low roll → save succeeds
→ SAVED
```

### Keeper wrong corner
```typescript
shot = { zone: 0, power: 0.7 }
dive = { zone: 8 }
cfg  = DIFFICULTIES.beginner  // saveRadius: 0
→ GOAL (distance = 2, out of radius)
```

### Blasted over the bar
```typescript
shot = { zone: 4, power: 0.95 }
rng  = () => 0.05  // triggers miss roll
→ MISSED
```

## Who uses this

| Context | Usage |
|---------|-------|
| Solo mode | Client calls directly in `state.ts` |
| Online mode | Server calls in `lobbyStore.ts` |
| Tests | `scoring.test.ts` with fixed RNG |

## Tests

```bash
npm test -w shared -- scoring
```

4 tests covering: out-of-radius goal, saved, save-roll-fail goal, high-power miss.
