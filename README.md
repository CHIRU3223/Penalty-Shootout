# Penalty Kings

A lightweight browser penalty-shootout game built with TypeScript, Canvas 2D, React, and Socket.IO.

## Features

- **Solo vs AI** — Beginner, Intermediate, and Pro difficulties
- **Online 2-player** — create/join rooms with a shareable code
- **Drag-to-aim** shooting with live trajectory preview
- **Humanoid** striker and goalkeeper characters
- **Authoritative server** for online matches (anti-cheat)

## Quick start

```bash
# Install dependencies
npm install

# Terminal 1 — game server (online mode)
npm run dev:server

# Terminal 2 — client
npm run dev:client
```

Open http://localhost:5173

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:client` | Vite dev server (port 5173) |
| `npm run dev:server` | Socket.IO server (port 3001) |
| `npm run build` | Build shared, client, and server |
| `npm test` | Run Vitest (scoring + AI tests) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Project structure

```
shared/     Types, scoring, AI logic, message contracts
client/     Vite + React + Canvas game
server/     Socket.IO authoritative multiplayer server
```

## Environment

Copy `.env.example` and adjust:

- `PORT` — server port (default 3001)
- `CLIENT_ORIGIN` — CORS origin for the Socket.IO server
- `VITE_SERVER_URL` — client-side server URL for online play

## How to play

**Shooting:** Drag upward toward the goal, release to kick. Hold longer = more power.

**Keeping:** Tap a zone on the goal to dive.

**Online:** Create Room → share code → both Ready → host clicks Start Match.

## Deploy

### Client (static)

```bash
npm run build -w client
# Deploy client/dist to Vercel, Netlify, or Cloudflare Pages
```

Set `VITE_SERVER_URL` to your production server URL at build time.

### Server (Docker)

```bash
docker build -f server/Dockerfile -t penalty-kings-server .
docker run -p 3001:3001 -e CLIENT_ORIGIN=https://your-app.vercel.app penalty-kings-server
```

Works on Render, Railway, Fly.io, or any host supporting WebSockets.

## Tests

```bash
npm test -w shared
```

Covers scoring outcomes and AI decision logic.

## Documentation

Full docs in [`docs/`](./docs/README.md):

- [Gameplay Guide](./docs/04-GAMEPLAY.md) — rules and controls
- [Architecture](./docs/03-ARCHITECTURE.md) — system design
- [Development Phases](./docs/02-PHASES.md) — what was built
- [Multiplayer](./docs/09-MULTIPLAYER.md) — online play
- [UX Notes](./docs/13-UX-NOTES.md) — known confusion points
