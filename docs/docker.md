# Docker Setup

## Architecture

```
Browser → localhost:3000 (web)
                ↓ proxy /api/*
          localhost:4000 (api)
              ↙        ↘
    db:5432          piston:2000
   (postgres)     (code execution)
```

All 4 services run on a shared bridge network (`codegames-network`) and communicate via Docker's internal DNS using service names (`db`, `api`, `web`, `piston`).

## Startup Order

Controlled via `depends_on` with healthchecks:

1. **db** - Postgres starts first. Healthcheck: `pg_isready`
2. **piston** - Starts in parallel with db. Custom entrypoint sets up cgroups, starts the Piston API, then auto-installs `node` and `python` runtimes if missing. Healthcheck: Node HTTP request to `/api/v2/runtimes`
3. **api** - Waits for both `db` (healthy) and `piston` (healthy). Entrypoint runs `prisma migrate deploy` + `prisma generate`, then starts the Express server
4. **web** - Waits for `api`. Vite dev server starts on port 3000 with a proxy forwarding `/api/*` to `http://api:4000`

## Volume Strategy

| Volume | Purpose |
|---|---|
| `pgdata` (named) | Persists Postgres data across restarts |
| `./codegames-api:/app` | Bind mount for hot reload in dev |
| `./codegames-web:/app` | Bind mount for Vite HMR in dev |
| `/app/node_modules` (anonymous) | Preserves container's node_modules from being overwritten by bind mount |
| `./piston/packages` | Persists installed runtimes so they don't re-download on restart |
| `./piston/jobs` | Piston job execution scratch space |

## Key Design Decisions

- **Vite proxy** - The web container proxies `/api` requests to the API container, avoiding CORS issues. Configured in `vite.config.ts` reading `API_URL` from environment
- **Piston entrypoint** - Custom script because the Piston image has no `curl` or `piston` CLI. Uses Node's `http` module for healthchecks and runtime installation via the Piston HTTP API
- **Piston privileged mode** - Required for cgroup v2 sandbox isolation that Piston uses to safely execute untrusted code
- **Environment layering** - `.env` has defaults/placeholders, `.env.local` has real values. Docker Compose `environment:` keys can further override both
- **`.dockerignore`** - Both API and web exclude `node_modules` from the build context, preventing slow builds and platform mismatches

## Common Commands

```bash
# Start everything
docker compose up

# Start everything (rebuild images)
docker compose up --build

# Start a specific service
docker compose up -d web

# Rebuild a service with fresh node_modules
docker compose rm -sv web && docker compose up --build web

# View logs
docker compose logs -f api

# Check service health
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## Troubleshooting

### `node_modules` out of sync
The anonymous volume `/app/node_modules` caches dependencies from the initial build. After adding new packages, remove the container and its volumes to force a fresh install:
```bash
docker compose rm -sv <service> && docker compose up --build <service>
```

### Piston fetch failed
If the API logs show `fetch failed` on `PistonService.execute`, the Piston container is either not running or unhealthy. Check with:
```bash
docker ps -a --filter name=piston
docker logs codegames-piston
```

### Platform warning (ARM Mac)
The Piston image is `linux/amd64` only. On Apple Silicon it runs under Rosetta emulation - slightly slower but functional.
