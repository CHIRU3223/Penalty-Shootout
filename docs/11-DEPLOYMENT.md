# Deployment

## Prerequisites

- Node.js 22+
- npm
- Docker (optional, for server)

## Environment variables

Copy `.env.example`:

```env
# Server
PORT=3001
CLIENT_ORIGIN=http://localhost:5173

# Client (Vite — must be set at BUILD time)
VITE_SERVER_URL=http://localhost:3001
```

| Variable | Where | Purpose |
|----------|-------|---------|
| `PORT` | Server | Listen port |
| `CLIENT_ORIGIN` | Server | Socket.IO CORS allowed origin |
| `VITE_SERVER_URL` | Client build | Socket.IO server URL |

## Local development

```bash
npm install

# Terminal 1
npm run dev:server    # :3001

# Terminal 2
npm run dev:client    # :5173
```

Solo mode works with client only. Online requires both.

## Production build

```bash
npm run build
```

Builds in order: `shared` → `client` → `server`

Outputs:
- `shared/dist/` — compiled shared package
- `client/dist/` — static SPA
- `server/dist/` — compiled server

## Client deployment (static)

Deploy `client/dist/` to any static host:

- Vercel
- Netlify
- Cloudflare Pages

**Important:** Set `VITE_SERVER_URL` to your production server URL **before** building:

```bash
VITE_SERVER_URL=https://api.yourgame.com npm run build -w client
```

## Server deployment (Docker)

```bash
# Build image (from repo root)
docker build -f server/Dockerfile -t penalty-kings-server .

# Run
docker run -p 3001:3001 \
  -e PORT=3001 \
  -e CLIENT_ORIGIN=https://yourgame.vercel.app \
  penalty-kings-server
```

### Dockerfile stages

1. **build** — install deps, compile `shared` + `server`
2. **runtime** — production deps only, run `node server/dist/index.js`

## Render (recommended)

Use the included [`render.yaml`](../render.yaml) blueprint for two services:

| Service | Type | Purpose |
|---------|------|---------|
| `penalty-kings-api` | Docker Web Service | Socket.IO server |
| `penalty-kings-web` | Static Site | React client |

### Setup

1. In Render: **New → Blueprint** → connect your GitHub repo.
2. Apply the blueprint (creates both services).
3. Wait for **API** to deploy first, then **static site** rebuilds with `VITE_SERVER_URL` linked.
4. Open the static site URL — solo mode works immediately; online needs both services **Live**.

### Manual setup (without blueprint)

**API (Web Service → Docker)**

| Setting | Value |
|---------|-------|
| Root Directory | *(repo root)* |
| Dockerfile Path | `server/Dockerfile` |
| Health Check Path | `/health` |
| `CLIENT_ORIGIN` | `https://YOUR-STATIC-SITE.onrender.com` (exact URL, no trailing slash) |

**Client (Static Site)**

| Setting | Value |
|---------|-------|
| Build Command | `npm ci && npm run build -w shared && npm run build -w client` |
| Publish Directory | `client/dist` |
| `VITE_SERVER_URL` | `https://YOUR-API.onrender.com` (or hostname only — client adds `https://`) |

### Common Render failures

| Symptom | Fix |
|---------|-----|
| Deploy succeeds but health check fails | Server must listen on `0.0.0.0` and `process.env.PORT` (already configured) |
| Online shows "Connecting…" forever | Set `VITE_SERVER_URL` on static site **before** build; redeploy client after API is live |
| CORS / socket blocked | Set `CLIENT_ORIGIN` to exact static URL (`https://…`, no trailing slash) |
| Docker build fails on `npm ci` | Ensure `package-lock.json` is committed; build context is repo root |
| Works locally, not on Render | Render free tier sleeps — first request may take ~30s |

`CLIENT_ORIGIN` accepts comma-separated URLs if you use multiple client domains.

## Server hosting options

Any platform supporting WebSockets:

| Platform | Notes |
|----------|-------|
| Render | Web service, expose port |
| Railway | Web service + env vars |
| Fly.io | `fly deploy` with Dockerfile |
| VPS | `node server/dist/index.js` behind nginx |

## Checklist

- [ ] `CLIENT_ORIGIN` matches exact client URL (including https)
- [ ] `VITE_SERVER_URL` baked into client build points to server
- [ ] Server port exposed and WebSocket connections allowed
- [ ] HTTPS on both client and server in production

## Future scaling

- Redis adapter for Socket.IO multi-instance
- Redis-backed lobby store
- CDN for `client/dist` static assets
