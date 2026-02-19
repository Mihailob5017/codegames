# CodeGames Restructuring - What Changed & How It Works

## Overview

The app was restructured from a complex gaming/economics platform into a clean **LeetCode/HackerRank clone** skeleton. The goal: a focused codebase you can learn from and build on.

---

## What Was Removed

### Redis (entire integration)
- **Why**: Overkill for this app. The only use was caching user verification status, which is a simple DB lookup.
- **Files deleted**: `server/config/redis-config.ts`
- **Files updated**: Verified middleware now queries Postgres directly instead of checking Redis cache first.
- **Docker**: Redis service removed from `docker-compose.yml`. Judge0 still keeps its own Redis (it needs it internally).
- **Deps**: `redis` package removed from `package.json`.

### Admin Module (entire feature)
- **Why**: Not part of the core LeetCode clone flow.
- **Files deleted**: `server/controllers/admin/`, `server/services/admin/`, `server/repositories/admin/`, `server/routes/admin-route.ts`
- **Config**: `ADMIN_ROUTE` removed from env validation and `.env`.

### Credits/Unlock System
- **Why**: All problems are free now. No need for a virtual economy.
- **Schema changes**: Removed `credits`, `pointsScored`, `unlockCost`, `rewardCredits`, `accessLevel` fields.
- **Models deleted**: `UserProblemUnlock` (join table for locked problems).
- **Enum deleted**: `AccessLevel` (free/locked).
- **Code impact**: `CodeService` no longer calls `UserRepository` to award credits after submission. `CodeRepository` no longer calculates `creditsEarned`.

### Trie Search System
- **Why**: Premature optimization. Simple filtering/listing is enough for now.
- **Models deleted**: `TrieNode`, `SearchHistory`.
- **Fields removed**: `searchTokens` from Problem model.

### User Profile Fields
- **Why**: Simplifying the User model to essentials only.
- **Fields removed**: `country`, `avatar`, `isAvatarSelected`, `isProfileOpen`, `isProfileDeleted`.

---

## What Was Renamed (for consistency)

| Old Path | New Path | Why |
|----------|----------|-----|
| `controllers/auth/login-controller.ts` | `controllers/auth/auth-controller.ts` | It handles more than login (signup, OTP, refresh) |
| `routes/login-route.ts` | `routes/auth-route.ts` | Matches the controller name |
| `repositories/login/login-repositories.ts` | `repositories/auth/user-repository.ts` | Groups with other auth repos, clearer name |
| `repositories/code/code-respositories.ts` | `repositories/code/code-repository.ts` | Fixed typo ("respositories") |

All imports across the codebase were updated to match these new paths.

---

## What Was Added

### Java & C++ Language Support
- **`server/services/code/judge0-service.ts`**: Added language IDs for Java (62) and C++ (54). The `SupportedLanguage` type is now `"javascript" | "python" | "java" | "cpp"`.
- **`server/services/code/code-preparation-service.ts`**: Added code wrapping templates for Java and C++. Each language gets a test harness that:
  1. Calls the user's `solution()` function with test case args
  2. Compares the result to expected output
  3. Prints a JSON result (`{ success, output, expected, passed }`)
- **`server/controllers/code/code-controller.ts`**: Validation schema updated to accept all 4 languages.

---

## Current Architecture

### Request Flow

```
Client → Express → Middleware Stack → Routes → Controllers → Services → Repositories → Prisma/DB
                                                     ↓
                                              Judge0 (code execution)
```

### Middleware Stack (in order)
1. **RequestIdMiddleware** - Adds correlation ID to every request
2. **Logging** - Logs request/response with timing
3. **Helmet** - Security headers (CSP, XSS protection, etc.)
4. **CORS** - Cross-origin handling
5. **Rate Limiting** - 100 req/15min general limit
6. **Body Parser** - JSON + URL-encoded (10MB limit)
7. **Error Middleware** - Catches all errors, returns structured JSON

### API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/v1/auth/signup` | None | Register new user |
| `POST` | `/api/v1/auth/login` | None | Login (returns JWT + refresh token) |
| `POST` | `/api/v1/auth/verify-otp` | JWT | Verify email with 6-digit OTP |
| `POST` | `/api/v1/auth/resend-otp` | JWT + Rate Limit | Resend OTP email |
| `POST` | `/api/v1/auth/refresh-token` | None | Exchange refresh token for new JWT |
| `POST` | `/api/v1/code-execution/run-testcase` | JWT + Verified | Run code against 1 example test case |
| `POST` | `/api/v1/code-execution/run-all-testcases` | JWT + Verified | Run code against all test cases |
| `POST` | `/api/v1/code-execution/submit-solution` | JWT + Verified | Run all tests + save submission to DB |
| `GET` | `/health` | None | Basic health check |
| `GET` | `/health/detailed` | None | DB connection + memory stats |

### Auth Flow
```
1. POST /signup → Create user (unverified) → Send OTP email → Return JWT + refresh token
2. POST /verify-otp → Validate OTP → Mark user as verified
3. POST /login → Validate credentials → Check verified → Return JWT + refresh token
4. POST /refresh-token → Validate old token → Revoke it → Issue new pair (rotation)
```

- JWTs expire in 24h
- Refresh tokens expire in 7 days and use **token rotation** (old token is revoked, new one issued)
- If a revoked token is reused, ALL user tokens are revoked (abuse detection)

### Code Execution Flow
```
1. User sends: { problemId, userCode, language }
2. CodeService fetches test case(s) from DB
3. CodePreparationService wraps user code with test harness:
   - Injects solution() call with test args
   - Adds output comparison logic
   - Adds JSON result printing
4. Judge0Service sends wrapped code to Judge0 API (synchronous mode)
5. Judge0 runs code in isolated sandbox, returns stdout/stderr/status
6. CodeService parses JSON result from stdout
7. For /submit-solution: upserts Submission record (only updates if score >= existing)
```

---

## Database Schema (5 models)

### User
Core fields: `id`, `username`, `email`, `phoneNumb`, `passwordHash`, `verified`, `role`, `firstName`, `lastName`
OTP fields: `verifyToken`, `verifyTokenExpiry`
Relations: `submissions[]`, `refreshTokens[]`

### Problem
Fields: `id`, `title`, `description`, `hints[]`, `explanation`, `examples[]`, `difficulty`, `type`
Relations: `testCases[]`, `submissions[]`
Indexed by: `difficulty`, `type`

### TestCase
Fields: `id`, `problemId`, `input` (JSON), `expectedOutput` (JSON), `isExample`, `isHidden`, `timeLimit`, `memoryLimit`
Cascade delete from Problem.

### Submission
Fields: `id`, `userId`, `problemId`, `code`, `language`, `status`, `executionTime`, `memoryUsed`, `score`, `testCasesPassed`, `totalTestCases`, `errorMessage`
Upsert logic: only updates if new score >= existing score.

### RefreshToken
Fields: `id`, `userId`, `token`, `expiresAt`, `isRevoked`, `replacedBy`, `userAgent`, `ipAddress`
Supports token rotation tracking.

---

## Docker Compose Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `db` | postgres:15 | 5432 | Main app database |
| `judge0-db` | postgres:15 | internal | Judge0's own database |
| `judge0-redis` | redis:7-alpine | internal | Judge0's own Redis |
| `judge0-server` | judge0/judge0:1.13.1 | 2358 | Code execution API |
| `judge0-worker` | judge0/judge0:1.13.1 | - | Runs code in sandbox (privileged) |
| `backend` | ./server | 4000 | Express API server |
| `frontend` | ./client | 5173 | React dev server |

---

## File Structure (server/)

```
server/
├── config/
│   ├── express-config.ts      # Express app setup, middleware stack
│   ├── prisma-config.ts       # Prisma singleton, connection management
│   ├── logger-config.ts       # Winston logger
│   └── env-validation.ts      # Zod schema for env vars
│
├── controllers/
│   ├── auth/auth-controller.ts    # signup, login, verifyOTP, resendOTP, refreshToken
│   └── code/code-controller.ts    # runTestCase, runAllTestCases, submitSolution
│
├── services/
│   ├── auth/
│   │   ├── auth-service.ts            # User signup/login logic, OTP
│   │   └── refresh-token-service.ts   # Token rotation
│   ├── code/
│   │   ├── code-service.ts            # Orchestrates test execution
│   │   ├── code-preparation-service.ts # Wraps code for JS/Python/Java/C++
│   │   └── judge0-service.ts          # HTTP client for Judge0
│   └── email/
│       └── email-service.ts           # Nodemailer (Gmail SMTP)
│
├── repositories/
│   ├── auth/
│   │   ├── user-repository.ts         # User CRUD
│   │   └── refresh-token-repository.ts # Token CRUD
│   └── code/
│       └── code-repository.ts         # Problem, TestCase, Submission CRUD
│
├── routes/
│   ├── auth-route.ts          # POST /signup, /login, /verify-otp, etc.
│   ├── code-route.ts          # POST /run-testcase, /run-all-testcases, /submit-solution
│   ├── health-router.ts       # GET /health, /health/detailed
│   ├── main-router.ts         # Mounts all routes under /api/v1
│   └── index.ts               # Central route exports
│
├── middlewares/
│   ├── auth-middleware.ts         # JWT verification
│   ├── verified-middleware.ts     # Account verification check (DB query)
│   ├── error-middleware.ts        # Global error handler
│   ├── rate-limit-middleware.ts   # Per-route rate limiting
│   ├── request-id-middleware.ts   # Correlation IDs
│   └── validation-middleware.ts   # Request validation
│
├── types/dto/
│   ├── user-types.ts          # UserDTO, AuthResponseDTO, JwtPayloadDTO, etc.
│   └── problem-types.ts       # ProblemDTO, TestCaseDTO, enums
│
├── models/
│   └── user-model.ts          # Zod schemas for user input validation
│
├── utils/
│   ├── auth.ts                # JWT, bcrypt, token utilities
│   ├── constants.ts           # Validation rules, rate limits, enums
│   ├── helpers.ts             # parseEnv, sleep, etc.
│   └── request-validator.ts   # Input validation functions
│
├── prisma/
│   └── schema.prisma          # Database schema (5 models, 4 enums)
│
├── __tests__/utils/
│   └── test-helpers.ts        # Mock factories for tests
│
├── index.ts                   # Server entry point
├── package.json
├── Dockerfile
├── jest.config.ts
└── tsconfig.json
```

---

## Before You Run

1. **Upgrade Node.js to 18+** (your `.nvmrc` says 22.17.0, run `nvm use`)
2. `cd server && npm install` (removes redis from node_modules)
3. `npx prisma generate` (regenerate Prisma client for new schema)
4. `npx prisma migrate dev --name restructure-schema` (create migration)
5. `docker compose up --build`

---

## What To Build Next

- [ ] Problem listing/filtering endpoint (`GET /api/v1/problems`)
- [ ] Single problem detail endpoint (`GET /api/v1/problems/:id`)
- [ ] User submission history (`GET /api/v1/submissions`)
- [ ] Leaderboard endpoint (aggregate submissions by user)
- [ ] Seed script to populate problems + test cases
- [ ] Frontend: code editor (Monaco), problem display, test results UI
