# Development Guide

## Prerequisites

- Node.js 22+
- npm 9+

## First-time setup

```bash
git clone <repo>
cd penalty-kings
npm install
```

## Running

| Command | What it does |
|---------|--------------|
| `npm run dev` | Alias for `dev:client` |
| `npm run dev:client` | Vite dev server at http://localhost:5173 |
| `npm run dev:server` | Socket.IO server at http://localhost:3001 |

### Solo only
```bash
npm run dev:client
```

### Online (need both)
```bash
# Terminal 1
npm run dev:server

# Terminal 2
npm run dev:client
```

## Building

```bash
npm run build              # all packages
npm run build -w shared    # shared only
npm run build -w client    # client only
npm run build -w server    # server only
```

## Testing

```bash
npm test                   # shared + client
npm test -w shared         # scoring + AI tests (9 tests)
npm test -w shared -- ai   # AI tests only
npm test -w shared -- scoring
```

## Linting & formatting

```bash
npm run lint               # ESLint
npm run format             # Prettier write
```

## Workspace structure

```json
// package.json
"workspaces": ["shared", "client", "server"]
```

Import shared code in client/server:

```typescript
import { computeOutcome, type Zone } from '@pk/shared';
```

Shared must be built before server (client resolves via Vite alias/workspace):

```bash
npm run build -w shared
```

During dev, `tsx watch` on server and Vite on client typically handle this.

## TypeScript config

- `tsconfig.base.json` — shared compiler options
- Each package has its own `tsconfig.json`

## Adding a new socket message

1. Add type to `shared/src/messages.ts`
2. Rebuild shared: `npm run build -w shared`
3. Handle in `server/src/index.ts`
4. Handle in `client/src/net/socketClient.ts` consumers

## Adding a new difficulty

1. Edit `shared/src/difficulty.ts`
2. Add tests in `shared/src/ai.test.ts` if behavior changes
3. Rebuild

## Common issues

| Problem | Fix |
|---------|-----|
| Online can't connect | Ensure server running; check `VITE_SERVER_URL` |
| CORS error | Set `CLIENT_ORIGIN` to exact client URL |
| `@pk/shared` not found | Run `npm install` from root; build shared |
| Game stuck after shot | Was caused by per-frame `resetBall()` — fixed in Phase 1.5 |
| Type errors after shared change | `npm run build -w shared` then rebuild client/server |

## File conventions

- Game loop code: plain TS objects, no React
- UI state: Zustand (`appStore.ts`)
- Shared logic: pure functions, injectable RNG for tests
- Canvas drawing: `renderer.ts` + `characters.ts`
