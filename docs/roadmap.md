# CodeGames — Roadmap

> Single source of truth for what's done and what's next.
> Organised by release scope; cross-cutting tech-debt lives at the bottom.
> Last updated: 2026-06-01

---

## Phase 1 — MVP (1.0)

The core loop: browse problems, write code, run/submit, see results.

### Auth & Users

- [x] Register endpoint — Zod validation, bcrypt password hash, duplicate check, profile image upload
- [ ] Wire up auth (JWT access token + refresh token rotation)
- [ ] OTP email verification endpoint
- [ ] Login endpoint — returns JWT + refresh token
- [ ] Logout endpoint — revoke refresh token
- [ ] Token refresh endpoint — rotation (old token revoked, new one issued)
- [ ] Forgot / reset password flow
- [ ] Auth guard middleware — verify JWT on protected routes
- [ ] Role guard middleware — ADMIN and SUPER_USER checks
- [ ] Add `RefreshToken` model to schema + migration
- [ ] Anonymous browsing — anyone can view problems and attempt to solve, but nothing is tracked
- [ ] Logged-in users get: tracked submissions, leaderboard ranking, streaks, problem of the day
- [ ] Google OAuth login
- [ ] Profile page: activity heatmap (GitHub-style dots), leaderboard position, preferences, editable info
- [ ] User preferences: default language, light/dark theme
- [ ] `GET /user/profile` — return current user
- [ ] `PUT /user/profile` — update name, avatar, country, preferences
- [ ] User profile stats endpoint
- [ ] Current-user submissions endpoint

### Problems & Code Execution

- [x] Problem CRUD (admin): create, read, update, delete
- [x] Problem search/filter: difficulty, category, published status, free text
- [x] Starter code per language (admin endpoints + DB)
- [x] Test cases: sample + hidden, single and bulk add (admin endpoints + DB)
- [x] Run code — sample tests only, returns pass/fail per case
- [x] Submit code — all test cases, returns full RunResult
- [x] Multi-language execution: Python, JavaScript, Java, C#, C++ via Piston
- [x] Rate limiting on code execution endpoints (10 req/min)
- [x] `AbortSignal.timeout(10s)` on Piston fetch — prevents hanging requests
- [ ] Solutions per language with explanation + time/space complexity (admin endpoints — model exists)
- [ ] Company tags admin endpoints — model + join table exist, no endpoints yet
- [ ] Problem images admin endpoints — model exists, no endpoints yet
- [ ] Public problem list — `GET /problems` (paginated, filterable, no hidden test-case data)
- [ ] Public problem detail — `GET /problems/:slug`
- [ ] Problem of the day — `DailyChallenge` model + `GET /problems/daily`
- [ ] Problem stats update on submission — increment totalSubmissions, acceptedSubmissions, acceptanceRate
- [ ] Add `Submission` model to schema + migration
- [ ] Add `UserProblemStatus` model to schema + migration
- [ ] Persist submissions — save to DB on execute
- [ ] Track UserProblemStatus — SOLVED / ATTEMPTED per user+problem
- [ ] Update `User.totalSolved` on first acceptance
- [ ] Decide: should `run` stay full-result, or switch to fail-fast?
- [ ] Time/memory limit handling + reporting
- [ ] Clearer compile/runtime error classification
- [ ] Execution metrics + latency logging around Piston

### Drawing / Whiteboard

- [ ] tldraw-style canvas on the problem page — sketch your approach before coding (client-side only)

### Leaderboard & Scoring

- [ ] Add `LeaderboardSnapshot` model to schema + migration
- [ ] Scoring: EASY=1, MEDIUM=3, HARD=5 (first-solve only)
- [ ] Background cron job — recompute leaderboard snapshots on a schedule
- [ ] `GET /leaderboard` — read from snapshot table (global, weekly, monthly)
- [ ] Streak tracking — currentStreak / longestStreak update on daily solve
- [ ] Add `DailyChallenge` model to schema + migration

### Admin

- [x] Admin route mounted at secret path (`ADMIN_ROUTE` env var)
- [x] Problem CRUD
- [x] Test case management (add single + bulk)
- [x] Starter code management (add single + bulk)
- [ ] Auth guard on admin routes (currently obscurity only)
- [ ] User list — view username, email, role, joined date
- [ ] User delete — hard delete + cascade
- [ ] Problem publish/unpublish toggle
- [ ] Analytics — submission counts, acceptance rates, active users

### Security & Infra

- [x] `helmet()` — security headers wired up
- [x] `express-rate-limit` — general (100/15min) + code execution (10/min)
- [x] Zod validation on all write endpoints
- [x] Environment variable validation at startup (Zod)
- [x] `cors({ origin: CORS_ORIGIN })` — restrict to known origins
- [ ] Auth middleware protecting all non-public routes
- [ ] Non-root Docker user (`USER node` in Dockerfile)
- [ ] Create production Dockerfile — multi-stage build, `npm run build`
- [ ] Move `nodemon` / `ts-node` / `supertest` to `devDependencies`
- [ ] Pin `wait-for-it.sh` to a specific commit hash

---

## Phase 2 — Super User (2.0)

Paid subscription tier with test creation and analytics.

- [ ] Monthly subscription model (Stripe integration TBD)
- [ ] Super user dashboard
- [ ] Add `PracticeTest`, `PracticeTestProblem`, `PracticeTestSession` models to schema
- [ ] Create timed tests: pick problems, set a time limit
- [ ] Generate shareable deeplink for a test
- [ ] Restrict problem visibility per test (disable solutions, hints per problem)
- [ ] Choose required algorithm/category for test problems
- [ ] Test analytics: attempts, failures, code typed, per-problem breakdown
- [ ] Test session enforcement — auto-submit when time limit expires

---

## Future Scope

Features to explore after 2.0. No fixed order.

- [ ] **Learning plans** — curated, ordered sequences of problems (e.g. "Blind 75", "Two Pointers Mastery")
- [ ] **Quiz mode** — non-coding questions (multiple choice, true/false) for theory (Big-O, data structures, system design)
- [ ] **Custom problems** — super users can author their own problems
- [ ] **Likes** — upvote/downvote problems
- [ ] **Pair programming** — real-time collaborative solving via shared editor (WebSocket)
- [ ] **Speed competitions** — head-to-head or group races to solve problems fastest
- [ ] **Discussion** — threaded posts on problems, upvote/downvote, mod tools
- [ ] **Solution comparison** — after accepted submission, show time/space ranking vs other users
- [ ] **Pattern labels** — after solving, reveal the underlying pattern with a link to the relevant learning plan
- [ ] **Keyboard shortcuts** — vim/emacs keybindings in Monaco, global shortcuts (Ctrl+Enter to run)
- [ ] **Solution playback** — record keystrokes/diffs during a solve to replay thought process

---

## Cross-Cutting / Tech Debt

Not features — consistency, quality, and operational work that spans modules.
Run `/architecture-review` to regenerate concrete findings against the current code.

### Backend consistency & standards

- [x] Standardise services on **one** pattern — instance-based with a constructor (`auth.service` converted from static)
- [x] Standardise indentation across the API — Prettier + EditorConfig enforce tabs/4
- [x] Move remaining runtime-sensitive code off direct `process.env` reads (`piston.service`/`code.controller` now use `getAppConfig()`; `logger` + `error-middleware` documented as bootstrap exceptions)
- [x] Standardise module exports — default class exports + `index.ts` barrels on every slice
- [x] Standardise router files on `import { Router } from "express"`
- [ ] Audit and remove unused dependencies (verify `lodash` / `@types/lodash` are still needed)
- [x] Wire up lint — ESLint + Prettier installed and runnable (`npm run lint` / `format`)
- [ ] Add API lint + build to a CI check flow

### API & validation discipline

- [ ] Keep every write endpoint behind a Zod DTO; never expose raw Prisma input types as the HTTP contract
- [ ] Add a request-validation test for every new write endpoint
- [ ] Decide whether to rename `constrains` → `constraints` before the public API expands

### Observability & operations

- [ ] Add request / correlation ids to request logging
- [ ] Log response status + duration, not only request start
- [ ] Structured logging for external-service and DB/startup failures
- [ ] CI workflow for backend test + build

### Documentation

- [ ] Keep `docs/api-routes.md` current as endpoints land
- [ ] Keep `docs/architecture.md` limited to current-state architecture
- [ ] Keep `docs/technical-decisions.md` updated when major choices change
- [ ] Move stale/session notes into `docs/archive/` once they stop being active references

### Frontend follow-up (web app is still a Vite scaffold)

- [ ] Establish a real feature folder structure before major UI work
- [ ] Add a typed API client layer; stop calling admin endpoints from the public app
- [ ] Build proper run/submit result UI instead of temporary alerts
- [ ] Revisit whether Redux, Router, Axios, Formik, and i18n are all needed near-term

---

## Done — foundational

- [x] Feature-module project structure (`auth/`, `code/`, `admin/`, `user/`, `shared/`, `infrastructure/`)
- [x] Prisma 7 setup with `prisma.config.ts`, PostgreSQL adapter, shared singleton
- [x] Full DB schema: Problem, TestCase, StarterCode, ProblemSolution, ProblemImage, Company, ProblemCompany, User
- [x] Submission + leaderboard enums defined (`submission_status`, `problem_status`) — models pending
- [x] Code execution pipeline: wrapCode (5 languages) → Piston → compareOutputs
- [x] Admin CRUD: problems, test cases, starter codes — full test coverage
- [x] Shared error classes + error middleware (AppError / Prisma / unknown → HTTP)
- [x] Register endpoint, MinIO/S3 upload service, Winston logger
- [x] Validated env config bootstrap (`validateEnv` → `initializeAppConfig` → `getAppConfig`)
- [x] CORS origin restriction, helmet, general + code-execution rate limiting
- [x] All test files under `__tests__/` subdirectories
- [x] Prisma scripts: `migrate:dev`, `migrate:reset`, `migrate:new`, `migrate:status`, `migrate:rollback`
- [x] Pagination on problem list endpoints
