# Client Package (`@pk/client`)

Vite + React + Canvas 2D browser application.

## Entry points

| File | Purpose |
|------|---------|
| `src/main.tsx` | React root mount |
| `src/App.tsx` | Screen router (menu, match, lobby, result, settings) |
| `src/index.css` | Tailwind + global styles |

## UI screens (`src/ui/`)

| Screen | File | When shown |
|--------|------|------------|
| Main Menu | `MainMenu.tsx` | App start |
| Difficulty Select | `DifficultySelect.tsx` | Before solo match |
| Lobby | `LobbyScreen.tsx` | Online create/join |
| Match HUD | `MatchHUD.tsx` | Overlay during match |
| Solo Match | `GameCanvas.tsx` | Solo vs AI canvas |
| Online Match | `OnlineGameCanvas.tsx` | Online vs player canvas |
| Result | `ResultScreen.tsx` | Match end |
| Settings | `SettingsScreen.tsx` | Sound toggle |
| How to Play | `HowToPlay.tsx` | Rules help |

## State management (`src/store/appStore.ts`)

Zustand store fields:

| Field | Type | Purpose |
|-------|------|---------|
| `screen` | `Screen` | Current UI screen |
| `gameMode` | `'solo' \| 'online'` | Active mode |
| `difficulty` | `Difficulty` | AI level |
| `hud` | `HudState` | Match HUD data |
| `lobby` | `LobbyState` | Online lobby state |
| `winner` | `'player' \| 'opponent' \| 'draw'` | Match result |
| `soundEnabled` | `boolean` | SFX toggle (localStorage) |

## Game engine (`src/game/`)

### Core loop

```
loop.ts
  requestAnimationFrame
    → update(dt)   // state machine, animations
    → render()     // renderer.ts drawFrame()
```

### State machines

| File | Mode |
|------|------|
| `state.ts` | Solo vs AI — local `computeOutcome` |
| `onlineState.ts` | Online — waits for server `turn_result` |

### Input

| File | Mode |
|------|------|
| `input.ts` | Solo — drag-to-shoot, tap-to-dive |
| `onlineInput.ts` | Online — same gestures, sends socket intents |

### Rendering pipeline (`renderer.ts`)

Draw order (shooter camera):
1. Sky + pitch
2. Goal + net
3. Goalkeeper (AI)
4. Trajectory preview (if aiming)
5. Striker + ball
6. Power meter

Draw order (keeper camera):
1. Distant pitch + opponent striker
2. Goal + dive zones
3. Goalkeeper (player)
4. Ball (during flight)

### Camera (`camera.ts`)

| Mode | Layout function | Perspective |
|------|-----------------|-------------|
| `shooter` | `computeShooterLayout()` | Behind striker, goal ahead |
| `keeper` | `computeKeeperLayout()` | Behind goal, keeper in front |

### Characters (`characters.ts`)

Procedural vector humanoids (no image assets):
- **Striker** — jersey, shorts, head, kicking leg animation
- **Goalkeeper** — gloves, ready stance, horizontal dive pose

### Ball physics (`ball.ts`)

Parametric arc (not a physics engine):

```
x = lerp(startX, targetX, t)
y = lerp(startY, targetY, t) - sin(π·t) · arcHeight
```

`trajectory.ts` reuses the same math for the preview arc.

## Networking (`src/net/`)

| File | Purpose |
|------|---------|
| `socketClient.ts` | Connect, send/receive `message` events |

Uses `VITE_SERVER_URL` (default `http://localhost:3001`).

## Sounds (`src/game/sounds.ts`)

Web Audio API oscillators (no audio files):
- `goal`, `save`, `miss`, `kick`, `whistle`
- Toggle via Settings; persisted as `pk-sound` in localStorage

## Scripts

```bash
npm run dev -w client      # Vite dev server :5173
npm run build -w client    # tsc + vite build → client/dist
npm run preview -w client  # Preview production build
```

## Dependencies

- `react`, `react-dom` — UI shell
- `zustand` — lightweight store
- `socket.io-client` — online multiplayer
- `@pk/shared` — types, scoring, AI, messages
