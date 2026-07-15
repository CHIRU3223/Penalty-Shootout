# Server Package (`@pk/server`)

Node.js + Socket.IO authoritative multiplayer server.

## Entry point

`server/src/index.ts` — HTTP server + Socket.IO on single port.

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3001` | Server listen port |
| `CLIENT_ORIGIN` | `http://localhost:5173` | CORS origin for Socket.IO |

## Architecture

```
Socket connection
    → 'message' event (ClientToServerMessage)
    → lobbyStore lookup
    → validate + mutate match state
    → computeOutcome() from @pk/shared
    → emit 'message' (ServerToClientMessage) to room
```

## Lobby store (`src/rooms/lobbyStore.ts`)

In-memory storage (no database).

### Lobby structure

```typescript
{
  code: string;           // 5-char room code
  host: { id, ready };
  guest: { id, ready } | null;
  status: 'waiting' | 'playing' | 'finished';
  match: OnlineMatchState;
  shotTimer: Timeout | null;
}
```

### Key functions

| Function | Purpose |
|----------|---------|
| `createLobby(hostId)` | Generate code, register host |
| `joinLobby(code, guestId)` | Guest joins if room open |
| `tryResolveTurn(lobby)` | Both intents in → compute outcome |
| `startShotTimer(lobby, cb)` | 8s shot clock |
| `matchStartMessage(lobby, side)` | Initial match state per player |

## Message handling

See [Multiplayer](./09-MULTIPLAYER.md) for full message list.

### Turn resolution

A turn resolves when **both** are received:
- `submit_shot` from the current shooter
- `submit_dive` from the current keeper

If shot clock expires, server fills missing intent with center zone defaults.

### Disconnect handling

| Who left | Behavior |
|----------|----------|
| Host | Lobby deleted; guest gets `opponent_disconnected` |
| Guest | Guest slot cleared; host gets `opponent_disconnected` + updated `lobby_state` |

## Authority model

- Clients send **intents only** (`Shot`, `Dive`)
- Server runs `computeOutcome(shot, dive, difficulty)` — never trusts client outcome
- Server runs `applyTurnToMatch()` for score/round/sudden-death advancement

## Scripts

```bash
npm run dev -w server    # tsx watch src/index.ts
npm run build -w server  # tsc → server/dist
npm run start -w server  # node dist/index.js
```

## Docker

```bash
docker build -f server/Dockerfile -t penalty-kings-server .
docker run -p 3001:3001 -e CLIENT_ORIGIN=http://localhost:5173 penalty-kings-server
```

See [Deployment](./11-DEPLOYMENT.md).

## Scaling notes (future)

- Current: single process, in-memory lobbies
- For multi-instance: add Redis for lobby store + Socket.IO adapter
- No database required for MVP
