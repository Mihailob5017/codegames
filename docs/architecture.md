# CodeGames — Architecture

> System design, module responsibilities, and data flow diagrams.

---

## System Overview

CodeGames is currently composed of two applications and three infrastructure services, all orchestrated via Docker Compose.

```mermaid
graph TD
    Browser["Browser"]

    subgraph Docker["Docker Compose — codegames-network"]
        Web["codegames-web\nReact + Vite\n:3000"]
        API["codegames-api\nExpress 5 + TypeScript\n:4000"]
        DB["PostgreSQL 15\n:5432"]
        Piston["Piston\n(code execution sandbox)\n:2000"]
        MinIO["MinIO\n(S3-compatible object storage)\n:9000"]
    end

    Browser -->|"HTTP /api/*"| Web
    Web -->|"REST /api/v1/*"| API
    API -->|"Prisma ORM"| DB
    API -->|"POST /api/v2/execute"| Piston
    API -->|"AWS SDK S3"| MinIO
```

**Startup order** (via `depends_on` + healthchecks):
1. `db` and `piston` start in parallel
2. `api` waits for both to be healthy
3. `web` waits for `api`

---

## API Module Breakdown

```
codegames-api/
├── auth/               # Registration (login/JWT planned)
├── code/               # Code execution via Piston
├── admin/
│   ├── problems/       # Problem CRUD
│   ├── test-cases/     # Test case management
│   └── starter-codes/  # Starter code management
├── user/               # Profile placeholder (not yet implemented)
├── upload/             # File upload to MinIO/S3
├── infrastructure/     # Express, Prisma, logger, env config
├── middleware/         # Error handling, rate limiting, request logging
└── shared/             # Error classes, types, test utilities
```

### Module Status

| Module | Status | What's Implemented | What's Missing |
|--------|--------|-------------------|----------------|
| `auth` | Partial | Register with validation, password hash, profile image | Login, JWT, refresh tokens, email OTP, logout, Google OAuth |
| `code` | Done | Run (sample tests) + Execute (all tests), 5 languages, Piston integration | Submission persistence, timing limits |
| `admin/problems` | Done | Full CRUD, search/filter by difficulty/category/published | Company/image/solution endpoints |
| `admin/test-cases` | Done | Get, add single, add bulk | — |
| `admin/starter-codes` | Done | Get, add single, add bulk | — |
| `user` | Stub | `findById()` only | All profile endpoints, stats, streaks |
| `upload` | Done | MinIO bucket setup, single/multi file upload | — |
| `infrastructure` | Done | Helmet, CORS, rate limiting, error handling, Zod env validation, Winston logger, validated config bootstrap | Auth guard wiring |
| `middleware` | Done | Error mapping, request logger, rate limiter | Auth guard (JWT verification) |
| `shared` | Done | Custom error classes, test utilities | — |

---

## Request Middleware Pipeline

Every incoming request passes through this chain before reaching a route handler:

```mermaid
flowchart LR
    R["Incoming\nRequest"]
    C["cors()\nOrigin restriction"]
    H["helmet()\nSecurity headers"]
    RL["requestLogger\nWinston logging"]
    GR["generalRateLimiter\n100 req / 15 min"]
    JP["express.json()\nBody parsing"]
    RH["Route Handler\n(controller)"]
    EM["errorMiddleware\nZod / AppError / Prisma / 500"]
    RES["Response"]

    R --> C --> H --> RL --> GR --> JP --> RH
    RH -->|"error thrown"| EM
    RH -->|"success"| RES
    EM --> RES
```

Code execution routes additionally pass through `codeSubmissionRateLimiter` (10 req / min per IP) before the controller.

### Runtime configuration bootstrapping

Startup now follows this order:

1. `validateEnv(process.env)` parses and validates the environment
2. `initializeAppConfig(config)` stores the validated config once
3. infrastructure and feature services read config through `getAppConfig()`

This keeps runtime-sensitive services away from ad hoc `process.env` reads and avoids module-load ordering bugs.

---

## Code Execution Flow

This covers both `POST /run` (sample tests) and `POST /execute` (all tests).

```mermaid
sequenceDiagram
    participant Client
    participant CodeController
    participant CodeService
    participant CodeRepository
    participant CodePreparationService
    participant PistonService
    participant Piston

    Client->>CodeController: POST /run { code, language, problemId }
    CodeController->>CodeController: Validate with CodeExecutionSchema (Zod)
    CodeController->>CodeService: run(input)

    CodeService->>CodeRepository: getSampleTestCases(problemId)
    CodeRepository-->>CodeService: TestCase[]
    CodeService->>CodeService: throw NotFoundError if empty

    CodeService->>CodePreparationService: wrapCode(code, language, testCases)
    Note over CodePreparationService: Injects test cases as literals<br/>Adds runner loop for the language<br/>Produces one self-contained script
    CodePreparationService-->>CodeService: wrappedCode (string)

    CodeService->>PistonService: execute(language, wrappedCode)
    PistonService->>Piston: POST /api/v2/execute { language, version, files }
    Piston-->>PistonService: { run: { stdout, stderr, code } }
    PistonService-->>CodeService: { stdout, stderr, exitCode }

    CodeService->>CodeService: compareOutputs(testCases, stdout, stderr)
    Note over CodeService: Split stdout by newline<br/>Compare each line to expectedOutput<br/>JSON-normalized deep equality

    CodeService-->>CodeController: RunResult { allPassed, total, passed, failed, results[] }
    CodeController-->>Client: 200 { status: "success", data: RunResult }
```

### Code Wrapping (per language)

`CodePreparationService` generates a self-contained script per language. The test cases are embedded as hardcoded literals — no stdin/stdout piping is needed.

| Language | Harness approach |
|----------|-----------------|
| JavaScript | Test args spread into `solution(...)`, each result logged as JSON |
| Python | Test case JSON base64-encoded to avoid quote/newline escaping issues |
| Java | User code wrapped in a `Solution` class; args emitted as typed Java literals at wrap time, results serialized by a generated `__json` helper |
| C# | User code wrapped in a `Solution` class; typed literals + a generated `Serialize` helper |
| C++ | Typed `main()` with one block per test case; `serialize` overloads cover the common return types |

---

## Planned: Authentication Flow

> **Status:** Register endpoint is live. Login, JWT, and email verification are not yet implemented.

```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant AuthService
    participant AuthRepository
    participant EmailService
    participant DB

    %% Registration
    Client->>AuthController: POST /auth/register { username, email, password, ... }
    AuthController->>AuthController: Validate RegisterSchema (Zod)
    AuthController->>AuthService: register(input, profileImage?)
    AuthService->>AuthService: bcrypt.hash(password, validated SALT_ROUNDS)
    AuthService->>AuthRepository: findByUsernameOrEmail (duplicate check)
    AuthRepository->>DB: SELECT id WHERE username=? OR email=?
    DB-->>AuthRepository: null | User
    AuthService->>DB: INSERT user
    AuthService->>EmailService: sendOTP(email)     ← NOT YET IMPLEMENTED
    AuthController-->>Client: 201 { status: "success" }

    %% Login (planned)
    Client->>AuthController: POST /auth/login { email, password }
    AuthController->>AuthService: login(email, password)
    AuthService->>DB: SELECT user WHERE email=?
    AuthService->>AuthService: bcrypt.compare(password, hash)
    AuthService->>DB: INSERT refresh_token
    AuthController-->>Client: 200 { accessToken, refreshToken }

    %% Token refresh (planned)
    Client->>AuthController: POST /auth/refresh { refreshToken }
    AuthController->>AuthService: refreshTokens(refreshToken)
    AuthService->>DB: SELECT + validate token (not expired, not revoked)
    AuthService->>DB: UPDATE old token isRevoked=true, INSERT new token
    AuthController-->>Client: 200 { accessToken, newRefreshToken }
```

---

## Planned: Submission Flow

> **Status:** Code execution works but results are not persisted. The Submission model still needs to be added to the schema.

```mermaid
sequenceDiagram
    participant Client
    participant CodeController
    participant CodeService
    participant SubmissionService
    participant DB

    Client->>CodeController: POST /execute { code, language, problemId }
    Note over Client,CodeController: Requires auth (JWT guard — not yet wired)

    CodeController->>CodeService: execute(input)
    Note over CodeService: (same Piston flow as above)
    CodeService-->>CodeController: RunResult

    CodeController->>SubmissionService: save(userId, problemId, code, language, RunResult)
    SubmissionService->>DB: INSERT submissions
    SubmissionService->>DB: UPSERT user_problem_status (SOLVED / ATTEMPTED)
    SubmissionService->>DB: UPDATE problem (totalSubmissions++, acceptedSubmissions++)
    SubmissionService->>DB: UPDATE user (totalSolved++ if first acceptance)

    CodeController-->>Client: 200 { status: "success", data: RunResult }
```

---

## Database Entity Relationships

### Current (in the DB now)

```mermaid
erDiagram
    Problem {
        string id PK
        int number UK
        string slug UK
        string difficulty
        string[] categories
        bool isPublished
        int totalSubmissions
        int acceptedSubmissions
        float acceptanceRate
    }
    TestCase {
        string id PK
        string problemId FK
        string input
        string expectedOutput
        bool isSample
    }
    StarterCode {
        string id PK
        string problemId FK
        string language
        string code
    }
    ProblemSolution {
        string id PK
        string problemId FK
        string language
        string approach
        string time_complexity
        string space_complexity
    }
    ProblemImage {
        string id PK
        string problemId FK
        string url
        int order
    }
    Company {
        string id PK
        string name UK
        string logoUrl
    }
    ProblemCompany {
        string problemId PK,FK
        string companyId PK,FK
        int frequency
    }
    User {
        string id PK
        string username UK
        string email UK
        string role
        bool isVerified
        int totalSolved
        int currentStreak
        int longestStreak
    }

    Problem ||--o{ TestCase : "has"
    Problem ||--o{ StarterCode : "has"
    Problem ||--o{ ProblemSolution : "has"
    Problem ||--o{ ProblemImage : "has"
    Problem ||--o{ ProblemCompany : "tagged in"
    Company ||--o{ ProblemCompany : "tags"
```

### Phase 1 additions (planned)

```mermaid
erDiagram
    User ||--o{ RefreshToken : "has"
    User ||--o{ Submission : "makes"
    User ||--o{ UserProblemStatus : "tracks"
    User ||--o{ LeaderboardSnapshot : "appears in"
    Problem ||--o{ Submission : "receives"
    Problem ||--o{ UserProblemStatus : "tracked by"
    Problem ||--o| DailyChallenge : "selected as"

    RefreshToken {
        string token UK
        datetime expiresAt
        bool isRevoked
    }
    Submission {
        string language
        string status
        int testCasesPassed
        int totalTestCases
        int executionTime
        datetime submittedAt
    }
    UserProblemStatus {
        string userId PK,FK
        string problemId PK,FK
        string status
        datetime solvedAt
    }
    LeaderboardSnapshot {
        string userId FK
        string period
        int rank
        int score
        int solved
    }
    DailyChallenge {
        string problemId FK
        date date UK
    }
```

---

## Scoring System (planned)

Points are weighted by difficulty. Solving a problem for the first time awards the full points; re-submissions do not award additional points.

| Difficulty | Points |
|------------|--------|
| EASY | 1 |
| MEDIUM | 3 |
| HARD | 5 |

The leaderboard is a **materialized snapshot** — a background cron job recomputes ranks from `User.totalSolved` + difficulty weights and writes to `LeaderboardSnapshot`. The leaderboard API reads from this table rather than aggregating live.

---

## Environment Variables Reference

| Variable | Used By | Description |
|----------|---------|-------------|
| `DATABASE_URL` | Prisma | PostgreSQL connection string |
| `API_PORT` | Express | Port the API listens on (default 4000) |
| `API_VERSION` | Express | URL prefix version segment (e.g. `v1`) |
| `ADMIN_ROUTE` | Express | Secret path prefix for admin routes |
| `JWT_SECRET` | Auth (planned) | Secret for signing JWT access tokens |
| `SALT_ROUNDS` | bcryptjs | Number of bcrypt hash rounds |
| `PISTON_URL` | PistonService | URL to Piston execute endpoint |
| `PISTON_VERSION_*` | PistonService | Runtime version per language (e.g. `PISTON_VERSION_JAVASCRIPT`) |
| `EMAIL_USER` | Email (planned) | SMTP sender address |
| `EMAIL_PASSWORD` | Email (planned) | SMTP password |
| `MINIO_ENDPOINT` | S3 client | MinIO server URL |
| `MINIO_ROOT_USER` | S3 client | MinIO access key |
| `MINIO_ROOT_PASSWORD` | S3 client | MinIO secret key |
| `MINIO_BUCKET` | S3 client | Default bucket name |
| `MINIO_PUBLIC_URL` | S3 client | Public-facing URL for serving uploaded files |

---

## Security Model

| Layer | Mechanism | Status |
|-------|-----------|--------|
| Security headers | `helmet()` middleware | ✅ Done |
| Rate limiting (general) | 100 req / 15 min per IP | ✅ Done |
| Rate limiting (code execution) | 10 req / min per IP | ✅ Done |
| Input validation | Zod schemas on all write endpoints | ✅ Done |
| Password storage | bcryptjs (configurable rounds) | ✅ Done |
| Auth guard (JWT verification) | Middleware on protected routes | ❌ Not yet |
| Role-based access control | ADMIN / SUPER_USER / USER role checks | ❌ Not yet |
| CORS origin restriction | `cors({ origin: CORS_ORIGIN })` | ✅ Done |
| Admin route obscurity | Secret `ADMIN_ROUTE` env var | ✅ Done (temporary) |
| Piston request timeout | `AbortSignal.timeout(10s)` | ✅ Done |
| Non-root Docker user | `USER node` in Dockerfile | ❌ Not yet |
