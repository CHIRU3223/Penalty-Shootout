# Overview

## What is Penalty Kings?

**Penalty Kings** is a browser-based football (soccer) penalty shootout game. Two roles alternate each turn: **shooter** (aim + kick) and **keeper** (pick a dive zone). Most goals after 5 rounds wins; tied games go to sudden death.

## Game modes

| Mode | Description |
|------|-------------|
| **Solo vs Computer** | Play against AI goalkeeper + AI striker on 3 difficulty levels |
| **Online vs Player** | Real-time 2-player via lobby code; server decides outcomes |

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | TypeScript, Vite, React, Zustand, Tailwind CSS |
| Rendering | HTML5 Canvas 2D (no game engine) |
| Backend | Node.js, TypeScript, Socket.IO |
| Shared | npm workspaces (`shared`, `client`, `server`) |
| Tests | Vitest (scoring + AI in `shared`) |

## Design goals

- **Lightweight** — small bundle, Canvas 2D only, no Phaser/Unity
- **Smooth** — 60 FPS `requestAnimationFrame` loop, parametric ball arc (no physics engine)
- **Fair online play** — authoritative server; clients send intents only
- **Tunable** — difficulty and scoring driven by config objects

## Repository structure

```
penalty-kings/
├── shared/          @pk/shared — types, scoring, AI, messages, match engine
├── client/          @pk/client  — Vite + React + Canvas game
├── server/          @pk/server  — Socket.IO multiplayer server
├── docs/            This documentation
├── .env.example     Environment variable template
├── package.json     Root workspace scripts
└── README.md        Quick-start guide
```

## Feature checklist (all phases)

- [x] Phase 1 — Core single-player loop (canvas, state machine, 5 rounds + sudden death)
- [x] Phase 1.5 — UX redesign (humanoid characters, drag-to-aim, trajectory preview, dual camera)
- [x] Phase 2 — AI difficulties (Beginner / Intermediate / Pro)
- [x] Phase 3 — Online multiplayer (lobbies, authoritative server)
- [x] Phase 4 — Polish (sounds, settings, how-to-play screen)
- [x] Phase 5 — Deploy (Dockerfile, .env.example, README)
