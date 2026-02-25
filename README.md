# CodeGames

A LeetCode-style coding challenge platform. Users submit code, it runs against test cases in a sandbox, and they get per-test pass/fail results back.

## Architecture

```text
Browser → localhost:3000 (web)
                ↓ proxy /api/*
          localhost:4000 (api)
              ↙        ↘
    db:5432          piston:2000
   (postgres)     (code execution)
```

**Services:**

- `web` — React + Vite frontend (port 3000)
- `api` — Express + TypeScript backend (port 4000)
- `db` — PostgreSQL 15 via Prisma ORM (port 5432)
- `piston` — sandboxed code execution engine (port 2000)

All services run in Docker Compose on a shared bridge network and communicate via Docker DNS.

## Quick Start

```bash
# 1. Copy and fill in your local env
cp .env .env.local   # then edit .env.local with real values

# 2. Start all services
docker compose up
```

Piston automatically installs Node.js and Python runtimes on first boot via a custom entrypoint. No manual setup needed.

## Project Structure

```text
codegames/
├── codegames-api/               # Express backend
│   ├── code/                    # Code execution feature
│   │   ├── piston.service.ts    # HTTP client for Piston
│   │   ├── wrapper.service.ts   # Wraps user code in test harness
│   │   ├── code.repository.ts   # Fetches problems + test cases from DB
│   │   ├── code.service.ts      # Orchestrates the full execution pipeline
│   │   ├── code.controller.ts   # HTTP request handler
│   │   └── code.route.ts        # Route definitions
│   ├── admin/                   # Admin feature (same structure)
│   ├── auth/                    # Auth feature (JWT, refresh tokens, OTP)
│   ├── infrastructure/
│   │   ├── express-config.ts    # Express setup + route mounting
│   │   ├── prisma-config.ts     # PrismaService lifecycle
│   │   ├── prisma.ts            # PrismaClient singleton
│   │   └── env-config.ts        # Zod env validation
│   ├── types/
│   │   ├── common.types.ts      # Shared types (ControllerType etc.)
│   │   └── dto.types.ts         # Request/response shapes
│   └── prisma/
│       └── schema.prisma        # DB schema
├── codegames-web/               # React + Vite frontend
├── codegames-dashboard/         # Admin dashboard (separate app)
├── piston/
│   └── piston-entrypoint.sh     # Custom entrypoint (cgroup setup + runtime install)
├── docs/                        # Documentation
│   ├── docker.md                # Docker setup details
│   ├── api-routes.md            # API endpoint reference
│   ├── schema-design.md         # Full DB schema design
│   ├── technical-decisions.md   # Architectural decisions log
│   └── todo.md                  # Task list
├── docker-compose.yml
├── .env                         # Committed defaults (no secrets)
└── .env.local                   # Local overrides — NOT committed
```

## Code Execution Pipeline

When a user clicks "Run":

```text
POST /api/{version}/code/run  { problemId, language, code }
        │
        ▼
1. Fetch problem + test cases from DB
        │
        ▼
2. Wrap user's function in a test harness (wrapper.service.ts)
        │
        ▼
3. Send the complete script to Piston (one HTTP request)
        │
        ▼
4. Piston executes it in a sandbox, returns stdout/stderr
        │
        ▼
5. Parse stdout → per-test results
        │
        ▼
{ passed: 2, failed: 1, results: [...] }
```

One "Run" click = one Piston execution request, regardless of how many test cases there are. The test harness iterates over all cases in a loop and writes one JSON line to stdout per case.

### Language map

| DB Enum    | Piston language | Install package | Piston version |
|------------|-----------------|-----------------|----------------|
| JAVASCRIPT | `javascript`    | `node`          | `20.11.1`      |
| PYTHON     | `python`        | `python`        | `3.12.0`       |
| JAVA       | `java`          | `java`          | `15.0.2`       |
| CSHARP     | `mono`          | `mono`          | `6.12.0`       |
| CPP        | `c++`           | `gcc`           | `10.2.0`       |

Versions can be overridden per-language via env vars (`PISTON_VERSION_JAVASCRIPT`, etc.).

## Environment Variables

| Variable            | Default                               | Description                    |
|---------------------|---------------------------------------|--------------------------------|
| `POSTGRES_USER`     | `postgres`                            | DB username                    |
| `POSTGRES_PASSWORD` | `CHANGE_ME_IN_ENV_LOCAL`              | DB password                    |
| `POSTGRES_DB`       | `codegames`                           | DB name                        |
| `DATABASE_URL`      | (built from POSTGRES_* vars)          | Prisma connection string       |
| `API_PORT`          | `4000`                                | Express server port            |
| `API_HOST`          | `0.0.0.0`                             | Express bind address           |
| `WEB_PORT`          | `3000`                                | Vite dev server port           |
| `DASHBOARD_PORT`    | `3001`                                | Admin dashboard port           |
| `NODE_ENV`          | `development`                         | Runtime environment            |
| `JWT_SECRET`        | *(required)*                          | JWT signing secret             |
| `JWT_EXPIRES_IN`    | `7d`                                  | JWT token TTL                  |
| `ADMIN_ROUTE`       | *(required)*                          | Secret admin URL prefix        |
| `API_VERSION`       | *(required)*                          | API version prefix (e.g. `v1`) |
| `CORS_ORIGIN`       | `http://localhost:3000,...`           | Allowed CORS origins           |
| `PISTON_URL`        | `http://piston:2000/api/v2/execute`   | Piston execute endpoint        |
| `EMAIL_USER`        | *(required for OTP)*                  | SMTP username                  |
| `EMAIL_PASSWORD`    | *(required for OTP)*                  | SMTP password                  |

See `.env` for the full list with defaults.

## Docker Commands

```bash
# Start everything
docker compose up

# Start with rebuild
docker compose up --build

# View logs
docker compose logs -f api
docker compose logs -f piston

# Stop everything
docker compose down

# Nuke volumes (resets DB + installed runtimes)
docker compose down -v

# Rebuild a service with fresh node_modules
docker compose rm -sv api && docker compose up --build api
```

## Documentation

- [Docker Setup](docs/docker.md) — services, volumes, healthchecks, troubleshooting
- [API Routes](docs/api-routes.md) — all endpoints with methods and paths
- [Schema Design](docs/schema-design.md) — full Prisma schema with design rationale
- [Technical Decisions](docs/technical-decisions.md) — architectural choices and their reasoning
- [TODO](docs/todo.md) — known issues and planned work
