# Development Phases

History of what was built, in delivery order.

---

## Phase 1 — Core single-player loop

**Goal:** Playable penalty shootout vs placeholder AI.

### Delivered

- npm workspaces monorepo (`shared`, `client`, `server` scaffold)
- Canvas game loop (`loop.ts`) with delta-time
- 3×3 goal zones (internal scoring grid)
- State machine: `AIM → SHOOT → RESOLVE → NEXT_TURN`
- 5 rounds alternating shooter/keeper + sudden death
- 8-second shot clock
- React menus: MainMenu, DifficultySelect, MatchHUD, ResultScreen
- Zustand store for screen/menu state
- Shared scoring module (`computeOutcome`)

### Initial UX issues

- Grid-on-goal aiming felt abstract
- No striker character visible
- Single behind-goal camera for all roles
- Blocky keeper shapes

---

## Phase 1.5 — Gameplay UX redesign

**Goal:** Person-based UI, trajectory preview, clearer aiming.

### Delivered

| File | Purpose |
|------|---------|
| `camera.ts` | Dual camera: shooter view vs keeper view |
| `characters.ts` | Procedural humanoid striker + goalkeeper |
| `striker.ts` | Idle / aim / wind-up / kick poses |
| `trajectory.ts` | Live dashed arc preview before release |
| `geometry.ts` | `zoneFromDrag()` — project drag direction onto goal |
| `input.ts` | Drag-up-to-aim, release-to-shoot (power from hold time) |

### Bug fixes during feedback

- **Critical:** `resetBall()` was called every frame → game stuck in SHOOT phase
- Simplified input to one gesture: drag + release = shoot
- Removed confusing 3×3 grid overlay when shooting

---

## Phase 2 — AI difficulties

**Goal:** Configurable AI for keeper and shooter.

### Delivered

| File | Purpose |
|------|---------|
| `shared/src/ai.ts` | `pickKeeperDive()`, `pickShooterShot()` |
| `shared/src/ai.test.ts` | 5 unit tests |
| `shared/src/difficulty.ts` | Beginner / Intermediate / Pro configs |
| `client/src/game/ai.ts` | Client wrapper `createAiOpponent()` |

### Difficulty parameters

| Level | saveChance | saveRadius | reactionMs | shooterAccuracy |
|-------|------------|------------|------------|-----------------|
| Beginner | 0.20 | 0 | 600 | 0.35 |
| Intermediate | 0.45 | 1 | 400 | 0.60 |
| Pro | 0.70 | 1 | 200 | 0.85 |

---

## Phase 3 — Online multiplayer

**Goal:** 2-player real-time lobbies with authoritative server.

### Delivered

**Server**

- `server/src/index.ts` — Socket.IO entry point
- `server/src/rooms/lobbyStore.ts` — in-memory lobbies, shot timers, disconnect handling

**Shared**

- `shared/src/matchEngine.ts` — online match state, turn advancement, sudden death
- `shared/src/messages.ts` — extended socket message contracts

**Client**

- `client/src/net/socketClient.ts` — Socket.IO client
- `client/src/ui/LobbyScreen.tsx` — create/join/ready/start
- `client/src/ui/OnlineGameCanvas.tsx` — networked match view
- `client/src/game/onlineState.ts` — online state machine
- `client/src/game/onlineInput.ts` — online input handlers

### Online flow

1. Host creates room → 5-char code
2. Guest joins with code
3. Both ready → host starts match
4. Clients send `submit_shot` / `submit_dive` intents
5. Server computes outcome → broadcasts `turn_result`

---

## Phase 4 — Polish

**Goal:** Juice, settings, onboarding.

### Delivered

| Feature | File |
|---------|------|
| Sound effects (goal/save/miss) | `client/src/game/sounds.ts` |
| Settings screen (sound toggle) | `client/src/ui/SettingsScreen.tsx` |
| How to Play screen | `client/src/ui/HowToPlay.tsx` |
| Main menu (solo + online + settings) | `client/src/ui/MainMenu.tsx` |
| Sound persisted in localStorage | `client/src/store/appStore.ts` |

---

## Phase 5 — Deploy & docs

**Goal:** Runnable locally and deployable.

### Delivered

- `server/Dockerfile` — multi-stage Node build
- `.env.example` — `PORT`, `CLIENT_ORIGIN`, `VITE_SERVER_URL`
- Root `README.md` — quick start
- `docs/` — full documentation (this folder)
