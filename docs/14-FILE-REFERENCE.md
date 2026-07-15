# File Reference

Complete list of source files and their purpose.

## Root

| File | Purpose |
|------|---------|
| `package.json` | Workspace root, scripts |
| `package-lock.json` | Dependency lock |
| `tsconfig.base.json` | Shared TypeScript config |
| `README.md` | Quick-start guide |
| `.env.example` | Environment template |
| `eslint.config.js` | ESLint config (if present) |

## `shared/src/`

| File | Purpose |
|------|---------|
| `index.ts` | Package exports |
| `types.ts` | Zone, Shot, Dive, Outcome, Difficulty, constants |
| `scoring.ts` | `computeOutcome()` — goal/saved/missed logic |
| `scoring.test.ts` | Scoring unit tests (4) |
| `difficulty.ts` | Beginner/Intermediate/Pro configs |
| `ai.ts` | `pickKeeperDive()`, `pickShooterShot()` |
| `ai.test.ts` | AI unit tests (5) |
| `messages.ts` | Socket.IO message type contracts |
| `matchEngine.ts` | Online match state + turn advancement |

## `server/src/`

| File | Purpose |
|------|---------|
| `index.ts` | HTTP + Socket.IO server entry |
| `rooms/lobbyStore.ts` | Lobby CRUD, timers, turn resolution |
| `Dockerfile` | Production Docker image (in `server/`) |

## `client/src/`

### App shell

| File | Purpose |
|------|---------|
| `main.tsx` | React mount |
| `App.tsx` | Screen router |
| `index.css` | Tailwind + globals |
| `vite-env.d.ts` | Vite env types |

### Store

| File | Purpose |
|------|---------|
| `store/appStore.ts` | Zustand global state |

### UI screens

| File | Purpose |
|------|---------|
| `ui/MainMenu.tsx` | Main menu |
| `ui/DifficultySelect.tsx` | Solo difficulty picker |
| `ui/LobbyScreen.tsx` | Online lobby |
| `ui/GameCanvas.tsx` | Solo match canvas |
| `ui/OnlineGameCanvas.tsx` | Online match canvas |
| `ui/MatchHUD.tsx` | In-game HUD overlay |
| `ui/ResultScreen.tsx` | Win/lose/draw screen |
| `ui/SettingsScreen.tsx` | Sound settings |
| `ui/HowToPlay.tsx` | Rules help |

### Game engine

| File | Purpose |
|------|---------|
| `game/loop.ts` | rAF game loop |
| `game/state.ts` | Solo state machine |
| `game/onlineState.ts` | Online state machine |
| `game/input.ts` | Solo pointer input |
| `game/onlineInput.ts` | Online pointer input |
| `game/geometry.ts` | Layouts, zones, drag projection |
| `game/camera.ts` | Shooter/keeper camera |
| `game/renderer.ts` | Canvas scene drawing |
| `game/ball.ts` | Ball flight + trail |
| `game/keeper.ts` | Keeper dive state |
| `game/striker.ts` | Striker pose state |
| `game/characters.ts` | Humanoid drawing |
| `game/trajectory.ts` | Aim preview arc |
| `game/ai.ts` | AI opponent wrapper |
| `game/opponent.ts` | Re-exports `createAiOpponent` |
| `game/sounds.ts` | Web Audio SFX |

### Networking

| File | Purpose |
|------|---------|
| `net/socketClient.ts` | Socket.IO client helpers |

## `docs/`

| File | Purpose |
|------|---------|
| `README.md` | Documentation index |
| `01-OVERVIEW.md` | Project overview |
| `02-PHASES.md` | Development phases |
| `03-ARCHITECTURE.md` | System architecture |
| `04-GAMEPLAY.md` | How to play |
| `05-CLIENT.md` | Client package |
| `06-SERVER.md` | Server package |
| `07-SHARED.md` | Shared package |
| `08-AI.md` | AI system |
| `09-MULTIPLAYER.md` | Online multiplayer |
| `10-SCORING-RULES.md` | Outcome logic |
| `11-DEPLOYMENT.md` | Deploy guide |
| `12-DEVELOPMENT.md` | Dev setup |
| `13-UX-NOTES.md` | UX feedback & ideas |
| `14-FILE-REFERENCE.md` | This file |

## Config files

| File | Package |
|------|---------|
| `client/package.json` | Client deps + scripts |
| `client/vite.config.ts` | Vite config |
| `client/tailwind.config.js` | Tailwind |
| `client/tsconfig.json` | Client TS |
| `server/package.json` | Server deps |
| `server/tsconfig.json` | Server TS |
| `shared/package.json` | Shared deps |
| `shared/tsconfig.json` | Shared TS |
