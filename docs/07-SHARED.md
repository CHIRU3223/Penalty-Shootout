# Shared Package (`@pk/shared`)

Pure TypeScript logic shared by client and server. No browser or Node I/O.

## Exports (`src/index.ts`)

```typescript
export * from './types.js';
export * from './messages.js';
export * from './difficulty.js';
export * from './scoring.js';
export * from './ai.js';
export * from './matchEngine.js';
```

## Files

### `types.ts`

Core game types:

| Type | Description |
|------|-------------|
| `Zone` | 0–8, 3×3 goal grid (row-major) |
| `Shot` | `{ zone, power }` |
| `Dive` | `{ zone }` |
| `Outcome` | `'GOAL' \| 'SAVED' \| 'MISSED'` |
| `PlayerRole` | `'shooter' \| 'keeper'` |
| `Difficulty` | `'beginner' \| 'intermediate' \| 'pro'` |
| `DifficultyConfig` | AI + save tuning object |

Constants: `MAX_ROUNDS = 5`, `SHOT_CLOCK_SECONDS = 8`

Helpers: `zoneDistance()`, `zoneToRowCol()`, `rowColToZone()`

### `scoring.ts`

```typescript
computeOutcome(shot, dive, cfg, rng?) → Outcome
```

Pure function — injectable `rng` for deterministic tests.

See [Scoring Rules](./10-SCORING-RULES.md).

### `difficulty.ts`

```typescript
DIFFICULTIES: Record<Difficulty, DifficultyConfig>
getDifficultyConfig(difficulty) → DifficultyConfig
```

### `ai.ts`

```typescript
pickKeeperDive(shot, cfg, rng?, ctx?) → Dive
pickShooterShot(cfg, rng?) → Shot
```

See [AI System](./08-AI.md).

### `messages.ts`

Typed Socket.IO message contracts (client ↔ server).

See [Multiplayer](./09-MULTIPLAYER.md).

### `matchEngine.ts`

Online match state machine (server-side turn advancement):

```typescript
createOnlineMatchState() → OnlineMatchState
applyTurnToMatch(state, shot, dive, outcome) → TurnResultPayload
scoreForClient(side, score) → { player, opponent }
roleForSide(side, shooter) → PlayerRole
winnerForClient(side, winner) → 'player' | 'opponent' | 'draw'
```

## Tests

```bash
npm test -w shared
```

| File | Tests |
|------|-------|
| `scoring.test.ts` | 4 tests — goal, saved, miss, high-power miss |
| `ai.test.ts` | 5 tests — keeper dive rates, shooter power/zones |

## Build

```bash
npm run build -w shared   # tsc → shared/dist
```

Client and server import via workspace dependency `"@pk/shared": "*"`.
