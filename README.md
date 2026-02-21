# CodeGames

A LeetCode-style coding challenge platform. Users submit code, it runs against test cases in a sandbox, and they get per-test pass/fail results back.

## Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Frontend      │         │   Backend API   │         │     Piston      │
│   (React)       │ ──────► │   (Express)     │ ──────► │ (Code Executor) │
│   Port: 3000    │         │   Port: 4000    │         │   Port: 2000    │
└─────────────────┘         └────────┬────────┘         └─────────────────┘
                                     │
                            ┌────────▼────────┐
                            │   PostgreSQL    │
                            │   Port: 5432    │
                            └─────────────────┘
```

**Services:**

- `codegames-api` — Express + TypeScript backend
- `db` — PostgreSQL 15 (Prisma ORM)
- `piston` — sandboxed code execution engine

## Quick Start

```bash
# 1. Copy and fill in your local env
cp .env .env.local   # then edit .env.local with real values

# 2. Start all services
docker compose up

# 3. Install Piston runtimes (first time only)
curl -s -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language":"node","version":"*"}'
```

## Project Structure

```
codegames/
├── codegames-api/               # Express backend
│   ├── code/                    # Code execution feature
│   │   ├── piston.service.ts    # HTTP client for Piston
│   │   ├── wrapper.service.ts   # Wraps user code in test harness
│   │   ├── code.respository.ts  # Fetches problems + test cases from DB
│   │   ├── code.service.ts      # Orchestrates the full execution pipeline
│   │   ├── code.controller.ts   # HTTP request handler
│   │   ├── code.route.ts        # Route definitions
│   │   └── index.ts             # Barrel export
│   ├── admin/                   # Admin feature (same structure)
│   ├── infrastructure/
│   │   ├── express-config.ts    # Express setup
│   │   ├── prisma-config.ts     # PrismaService lifecycle
│   │   ├── prisma.ts            # PrismaClient singleton
│   │   └── env-config.ts        # Zod env validation
│   ├── types/
│   │   ├── common.types.ts      # Shared types (ControllerType etc.)
│   │   └── dto.types.ts         # Request/response shapes
│   └── prisma/
│       └── schema.prisma        # DB schema
├── docker-compose.yml
├── .env                         # Committed defaults (no secrets)
└── .env.local                   # Local overrides — NOT committed
```

## Code Execution — How It Works

### The pipeline

When a user clicks "Run":

```
POST /code/run  { problemId, language, code }
        │
        ▼
1. Fetch problem + test cases from DB
        │
        ▼
2. Wrap user's function in a test harness
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

One "Run" click = one Piston execution request, regardless of how many test cases there are.

### What Piston is

[Piston](https://github.com/engineer-man/piston) is an open-source code execution engine. It runs code in isolated sandboxes with no network access and strict resource limits.

- **Free** — self-hosted, no API key, no usage limits
- **Sandboxed** — user code cannot access the host system
- **Multi-language** — supports 70+ languages via installable runtimes

In this project we run Piston as a Docker service. The API container talks to it over the internal Docker network via `http://piston:2000`.

### Piston API (what we use)

**List installed runtimes:**

```bash
GET /api/v2/runtimes
```

**Install a runtime (first-time setup):**

```bash
POST /api/v2/packages
{ "language": "node", "version": "*" }
```

Runtimes persist via the `./piston/packages` bind mount.

**Execute code:**

```bash
POST /api/v2/execute
{
  "language": "javascript",
  "version": "20.11.1",
  "files": [{ "content": "<source code here>" }]
}
```

Response:

```json
{
  "run": {
    "stdout": "hello\n",
    "stderr": "",
    "code": 0
  },
  "language": "javascript",
  "version": "20.11.1"
}
```

`code: 0` = clean exit. Non-zero = crash or thrown error.

### Language map

| Our DB enum | Piston language | Piston version |
|-------------|-----------------|----------------|
| JAVASCRIPT  | `javascript`    | `20.11.1`      |
| PYTHON      | `python3`       | `3.12.0`       |
| JAVA        | `java`          | `15.0.2`       |
| CSHARP      | `mono`          | `6.12.0`       |
| CPP         | `c++`           | `10.2.0`       |

Versions can be overridden per-language via env vars (`PISTON_VERSION_JAVASCRIPT`, etc.).

### The test harness (wrapper)

The user submits a raw function, e.g.:

```javascript
function twoSum(nums, target) {
  // their solution
}
```

`wrapper.service.ts` takes this function + the test cases from the DB and produces a complete runnable script:

```javascript
function twoSum(nums, target) {
  // their solution
}

// injected test harness
const cases = [
  { input: [[2,7,11,15], 9], expected: [0,1] },
  { input: [[3,2,4], 6],     expected: [1,2] },
];
for (let i = 0; i < cases.length; i++) {
  try {
    const result = twoSum(...cases[i].input);
    const pass = JSON.stringify(result) === JSON.stringify(cases[i].expected);
    console.log(JSON.stringify({ index: i, pass, result, expected: cases[i].expected }));
  } catch (e) {
    console.log(JSON.stringify({ index: i, pass: false, error: e.message }));
  }
}
```

stdout is one JSON line per test → easy to parse back into structured results.

### Test case format (in DB)

| Field            | Type    | Example            |
|------------------|---------|--------------------|
| `input`          | string  | `[[2,7,11,15],9]`  |
| `expectedOutput` | string  | `[0,1]`            |
| `isSample`       | boolean | `true`             |

Both `input` and `expectedOutput` are JSON-encoded. `input` is an array of arguments (spread into the function call).

## Environment Variables

| Variable                    | Default                             | Description                   |
|-----------------------------|-------------------------------------|-------------------------------|
| `DATABASE_URL`              | (built from POSTGRES_* vars)        | Prisma connection string       |
| `POSTGRES_USER`             | `postgres`                          | DB username                    |
| `POSTGRES_PASSWORD`         | `CHANGE_ME_IN_ENV_LOCAL`            | DB password                    |
| `POSTGRES_DB`               | `codegames`                         | DB name                        |
| `PISTON_URL`                | `http://piston:2000/api/v2/execute` | Piston execute endpoint        |
| `PISTON_VERSION_JAVASCRIPT` | `20.11.1`                           | Override JS runtime version    |
| `JWT_SECRET`                | *(required)*                        | JWT signing secret             |
| `API_PORT`                  | `4000`                              | Express server port            |
| `NODE_ENV`                  | `development`                       | Runtime environment            |

## Docker Commands

```bash
# Start everything
docker compose up

# Rebuild after code changes
docker compose up --build api

# View logs
docker compose logs -f api
docker compose logs -f piston

# Stop everything
docker compose down

# Nuke volumes (resets DB)
docker compose down -v
```

## Troubleshooting

### `FATAL: role "postgres" does not exist`

The healthcheck was using the wrong user. Fixed — the healthcheck now reads `POSTGRES_USER` from inside the container, which respects `.env.local`.

### Piston runtime not installed

On first run, install the Node.js runtime:

```bash
curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language":"node","version":"*"}'
```

It persists via `./piston/packages` bind mount — you only need to do this once.

### `piston` directory in git

`piston/` is gitignored — it contains downloaded runtime binaries, not source code.
