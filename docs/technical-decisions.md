# CodeGames — Technical Decisions

A record of every significant architectural and implementation choice, and the reasoning behind it.

---

## 1. Backend: Node.js + TypeScript + Express v5

**Decision:** The API is written in TypeScript running on Node.js, using Express v5 as the HTTP framework.

**Why TypeScript over plain JavaScript:**

- Catches type mismatches between the DB schema and the code at compile time rather than at runtime.
- Prisma's generated client is fully typed — query results match the schema automatically.
- Easier to onboard and refactor as the codebase grows.

**Why Express over NestJS / Fastify / Hono:**

- Express is the simplest option and the project does not need NestJS's opinions (decorators, DI container, modules). Structure is enforced manually via the feature-folder pattern.
- Fastify or Hono would also be valid — Express was chosen for familiarity and because the overhead of a small REST API does not warrant switching frameworks.

**Why Express v5 specifically:**

- v5 ships with async error propagation built in (unhandled promise rejections in route handlers are forwarded to the error middleware automatically). This removes a common source of silent crashes that required manual `try/catch` in every async handler with v4.

---

## 2. Project Structure: Feature Folders

**Decision:** Code is organised by feature, not by layer.

```text
codegames-api/
├── code/           # code execution feature
│   ├── code.controller.ts
│   ├── code.service.ts
│   ├── code.repository.ts
│   ├── piston.service.ts
│   ├── wrapper.service.ts
│   └── code.route.ts
├── admin/
├── auth/
├── infrastructure/
└── util/
```

**Why feature folders over layer folders (`controllers/`, `services/`, `repositories/`):**

- All code related to one domain is in one place. When working on code execution you never need to jump between three top-level directories.
- Each feature is more or less self-contained — easier to reason about, easier to delete or extract.

---

## 3. Database: PostgreSQL via Prisma ORM

**Decision:** PostgreSQL 15 as the database, accessed via Prisma ORM.

**Why PostgreSQL over MySQL / SQLite / MongoDB:**

- PostgreSQL is the most feature-complete open-source relational DB — native `String[]` array columns, full-text search, `JSONB`, window functions, and strong constraint enforcement all come for free.
- The schema uses arrays (e.g. `hints String[]`, `examples String[]`, `disabledHintIndices Int[]`) which are a first-class type in PostgreSQL but require a separate join table in MySQL.
- MongoDB was rejected because the data is inherently relational (users, problems, submissions, test cases all have hard foreign-key constraints that matter here).

**Why Prisma over TypeORM / Drizzle / raw pg:**

- The generated client gives full type safety without writing a manual type layer.
- Migrations are straightforward and versioned.
- Prisma Studio is useful for inspecting the DB during development.

**Prisma v7 specifics:**

- Upgraded from v6 to v7. The breaking change in v7 is that `url` is removed from the `datasource` block in `schema.prisma` — it now lives in `prisma.config.ts` instead. This is the canonical config file for Prisma 7 and handles schema path, migrations path, and `DATABASE_URL`.
- All imports use `@prisma/client` (standard path, no custom output path).

**Why `PrismaPg` adapter (driver adapter pattern):**

- Prisma v7 recommends using a native driver adapter (`@prisma/adapter-pg`) rather than the built-in query engine for Node.js. The `pg` library manages the connection pool directly, giving better control over pool size and connection lifecycle without a separate connection pooler.

---

## 4. Code Execution: Piston

**Decision:** User code is executed by [Piston](https://github.com/engineer-man/piston), self-hosted as a Docker service.

**Why Piston over Judge0 / Sphere Engine / AWS Lambda:**

| Option        | Cost        | Self-hosted | Complexity                          |
| ------------- | ----------- | ----------- | ----------------------------------- |
| Piston        | Free        | Yes         | Low                                 |
| Judge0 CE     | Pay-per-use | Yes         | Medium (needs own Postgres + Redis) |
| Sphere Engine | Paid API    | No          | Low                                 |
| AWS Lambda    | Pay-per-use | No          | High                                |

Judge0 was tried earlier in the project. It requires its own separate Postgres and Redis instances inside Docker and the `judge0-worker` container must run with `privileged: true` for its `isolate` sandbox. That adds significant Docker complexity. Piston was simpler — one container, no dependencies, no API key.

**Why self-hosted over the public Piston API (`emkc.org/api/v2/piston`):**

- The public API has rate limits and is not suitable for production.
- Self-hosting gives full control over which runtimes are installed and what resource limits are applied.
- The `PISTON_URL` env var makes it trivial to swap between local (`http://piston:2000/api/v2/execute`) and the public endpoint for debugging.

**Piston runtime install subtlety:**

- Piston ships with zero runtimes. Each must be installed via `POST /api/v2/packages`. The install package name and the runtime name are sometimes different (e.g. you install `gcc` but execute with language `c++`). Installed runtimes persist via the `./piston/packages` bind mount in `docker-compose.yml`.

---

## 5. Code Execution Pipeline: Harness Injection

**Decision:** User code is wrapped in a generated test harness and sent to Piston as a single script. One Piston request covers all test cases.

**Why not one request per test case:**

- Spinning up a sandbox has non-trivial overhead. Batching all test cases into one execution is significantly faster.
- The harness iterates over test cases in a loop and writes one JSON line to stdout per case — easy to parse back into structured results.

**How the harness works (`wrapper.service.ts`):**

- The user submits a function (e.g. `function solution(nums, target) { ... }`).
- `WrapperService` injects the test cases as hardcoded literals and adds a loop that calls `solution(...)` with each set of arguments, printing the result as JSON to stdout.
- Test case inputs are stored as JSON strings in the DB (e.g. `[[2,7,11,15],9]`) — an array of arguments that get spread into the function call.
- Each language has its own wrapper implementation to handle type system differences (Java and C++ need typed declarations; Python and JS can use dynamic argument spreading).

**Python encoding:**

- The Python wrapper base64-encodes the test case JSON before embedding it in the script. This avoids escaping issues with quotes and newlines inside string test cases.

---

## 6. Schema: `problem_category` Enum (vs. Tags)

**Decision (current):** Problem categories are stored as a PostgreSQL enum array (`problem_category[]`) on the `Problem` table.

**The trade-off:**

- Enums are fast to query and validated at the DB level — a problem cannot be assigned a typo'd category.
- The downside is that adding a new category requires a schema migration (`ALTER TYPE`).

**Future plan (documented in [schema-design.md](schema-design.md)):**

- Replace with a many-to-many `Tag` table so that admins can add new tags without a migration, and so tags can be shared between problems and discussion posts.

---

## 7. Test Case Format

**Decision:** `input` and `expectedOutput` are stored as JSON strings in the `TestCase` table.

```text
input:          "[[2,7,11,15],9]"   → parsed as [args to spread]
expectedOutput: "[0,1]"             → parsed and compared
```

**Why JSON strings over separate columns:**

- Problems have different argument shapes — Two Sum takes `(nums, target)`, another problem might take `(matrix, k)`. A fixed column schema cannot represent this without a very wide nullable table.
- JSON strings let the test case format be flexible per problem. The wrapper service parses them at wrap-time.
- `isSample: Boolean` distinguishes sample cases (shown to the user) from hidden cases (submit-only).

---

## 8. Environment Configuration: Zod Validation

**Decision:** All environment variables are validated at startup via a Zod schema in `env-config.ts`.

**Why:**

- Startup fails immediately with a clear error message if a required variable is missing or malformed (e.g. a non-URL string for `DATABASE_URL`, a port number out of range for `API_PORT`).
- Without this, the server starts successfully but crashes at runtime when the first request hits the misconfigured code path — much harder to diagnose.

**`.env` vs `.env.local`:**

- `.env` is committed to git and contains safe defaults and documentation comments. It has no real secrets.
- `.env.local` is gitignored and overrides `.env` with real credentials for local development. This pattern means a fresh clone always has a working default configuration to read through, but real secrets are never committed.

---

## 9. Piston Language Name Mapping

**Decision:** A `PISTON_LANGUAGE_MAP` in `piston.service.ts` translates between the internal `Language` enum (uppercase: `JAVASCRIPT`, `PYTHON`, etc.) and the strings Piston expects.

**Why needed:**

- Piston's runtime names are lowercase (`javascript`, `python`, `c++`) and are not always predictable from the enum value.
- The mapping also holds the default version string for each runtime, which can be overridden per-language via env vars (`PISTON_VERSION_JAVASCRIPT`, `PISTON_VERSION_PYTHON`, etc.) without a code change.

**Bug found and fixed during development:**

- Python was mapped to `"python3"` — Piston registers the runtime as `"python"`. The `"python3"` identifier is unknown and caused a 400 from Piston.
- C++ install package is named `"gcc"` but the runtime registers as `"c++"`. The execute request must use `"c++"`, not `"gcc"`.

---

## 10. Docker Compose Architecture

**Decision:** All services run in Docker Compose on a shared internal network (`codegames-network`).

```text
Browser → localhost:3000 (web)
                ↓ proxy /api/*
          localhost:4000 (api)
              ↙        ↘
    db:5432          piston:2000
   (postgres)     (code execution)
```

**Startup order (via `depends_on` + healthchecks):**

1. `db` + `piston` start in parallel
2. `api` waits for both `db` (healthy) and `piston` (healthy)
3. `web` waits for `api`

**Key choices:**

- All services communicate via Docker's internal DNS using service names (`db`, `api`, `web`, `piston`) — never `localhost`.
- `./piston/packages` is bind-mounted so installed runtimes persist across restarts without being baked into the image.
- `./codegames-api` and `./codegames-web` are bind-mounted for hot reload during development. Anonymous volumes (`/app/node_modules`) prevent the bind mount from overwriting the container's installed dependencies.
- `.dockerignore` files in both API and web exclude `node_modules` from the build context, preventing slow builds and platform mismatches.

**Anonymous volume caveat:**

- The `/app/node_modules` anonymous volume is created once and persists across rebuilds. After adding new packages, the container and its volumes must be removed to pick up changes: `docker compose rm -sv <service> && docker compose up --build <service>`.

**Why not Kubernetes / separate containers without Compose:**

- This is a personal learning project. Compose is the right level of complexity — simple to run, simple to understand, no infra overhead.

---

## 11. Auth Strategy (planned / in progress)

**Decision:** JWT access tokens (short-lived) + refresh token rotation + OTP email verification.

**Why JWT over sessions:**

- Stateless — the API can be scaled horizontally without a shared session store.
- The access token is short-lived (configurable via `JWT_EXPIRES_IN`). If it's stolen, the blast radius is time-limited.

**Why refresh token rotation:**

- Refresh tokens are long-lived by necessity. Rotation means each use of a refresh token issues a new one and invalidates the old one. If a token is stolen and used, the legitimate user's next request will fail and they'll be forced to re-authenticate — the theft is detectable.

**Why OTP email verification over magic links:**

- OTPs are shorter to type and work better on mobile where clicking a link in email may open a different browser session.

---

## 12. What Was Intentionally Left Out

| Omitted                           | Why                                                                                 |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| Redis                             | Was part of Judge0's stack. Removed when switching to Piston. Not needed currently. |
| Credits / points system           | All problems are free. A credits layer adds complexity with no current benefit.     |
| Real-time (WebSocket)             | Design as polling first; add WS when there's a concrete use case.                   |
| Image upload pipeline             | Schema stores a URL. Upload infra (S3, Cloudinary) is separate from app logic.      |
| User follow graph                 | Nice-to-have, low priority for MVP.                                                 |
| TypeScript strict mode everywhere | Some legacy files predate the strict config. Enforced on new code.                  |
