# CodeGames — Roadmap

> Organised by release scope. Each phase builds on the previous one.
> Last updated: 2026-04-17

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
- [ ] Auth guard middleware — verify JWT on protected routes
- [ ] Role guard middleware — ADMIN and SUPER_USER checks
- [ ] Add `RefreshToken` model to schema + migration
- [ ] Anonymous browsing — anyone can view problems and attempt to solve, but nothing is tracked
- [ ] Logged-in users get: tracked submissions, leaderboard ranking, streaks, problem of the day
- [ ] Google OAuth login
- [ ] Profile page: activity heatmap (GitHub-style dots), leaderboard position, preferences, editable info
- [ ] User preferences: default language, light/dark theme
- [ ] GET /user/profile — return current user
- [ ] PUT /user/profile — update name, avatar, country, preferences

### Problems & Code Execution

- [x] Problem CRUD (admin): create, read, update, delete
- [x] Problem search/filter: difficulty, category, published status, free text
- [x] Starter code per language (admin endpoints + DB)
- [x] Test cases: sample + hidden, single and bulk add (admin endpoints + DB)
- [x] Run code — sample tests only, returns pass/fail per case
- [x] Submit code — all test cases, returns full RunResult
- [x] Multi-language execution: Python, JavaScript, Java, C#, C++ via Piston
- [x] Rate limiting on code execution endpoints (10 req/min)
- [ ] Solutions per language with explanation + time/space complexity (admin endpoints — model exists)
- [ ] Company tags admin endpoints — model + join table exist, no endpoints yet
- [ ] Problem images admin endpoints — model exists, no endpoints yet
- [ ] Public problem list — GET /problems (paginated, filterable, no hidden test case data)
- [ ] Public problem detail — GET /problems/:slug
- [ ] Problem stats update on submission — increment totalSubmissions, acceptedSubmissions, acceptanceRate
- [ ] Problem of the day — DailyChallenge model + GET /problems/daily
- [ ] Add `Submission` model to schema + migration
- [ ] Add `UserProblemStatus` model to schema + migration
- [ ] Persist submissions — save to DB on execute
- [ ] Track UserProblemStatus — SOLVED / ATTEMPTED per user+problem
- [ ] Update User.totalSolved on first acceptance

### Drawing / Whiteboard

- [ ] tldraw-style canvas on the problem page — sketch your approach before coding (client-side only)

### Leaderboard & Scoring

- [ ] Add `LeaderboardSnapshot` model to schema + migration
- [ ] Scoring: EASY=1, MEDIUM=3, HARD=5 (first-solve only)
- [ ] Background cron job — recompute leaderboard snapshots on a schedule
- [ ] GET /leaderboard — read from snapshot table (global, weekly, monthly)
- [ ] Streak tracking — currentStreak / longestStreak update on daily solve
- [ ] Add `DailyChallenge` model to schema + migration

### Admin

- [x] Admin route mounted at secret path (ADMIN_ROUTE env var)
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
- [x] Non-root Docker user (`USER node` in Dockerfile) — verify this
- [ ] `cors({ origin: CORS_ORIGIN })` — restrict to known origins
- [ ] Auth middleware protecting all non-public routes
- [ ] `AbortSignal.timeout(10_000)` on Piston fetch — prevent hanging requests
- [ ] Create production Dockerfile — multi-stage build, `npm run build`
- [ ] Move `nodemon` / `ts-node` / `supertest` to `devDependencies`
- [ ] Pin `wait-for-it.sh` to a specific commit hash

---

## Phase 2 — Super User (2.0)

Paid subscription tier with test creation and analytics.

### Super User Features

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

## Done

- [x] Feature-module project structure (`auth/`, `code/`, `admin/`, `user/`, `shared/`, `infrastructure/`)
- [x] Prisma 7 setup with `prisma.config.ts`, PostgreSQL adapter
- [x] Full DB schema: Problem, TestCase, StarterCode, ProblemSolution, ProblemImage, Company, ProblemCompany, User (with role, streak, verification fields)
- [x] Submission + leaderboard enums defined (`submission_status`, `problem_status`) — models pending
- [x] Code execution pipeline: wrapCode (5 languages) → Piston → compareOutputs
- [x] Admin CRUD: problems, test cases, starter codes — full test coverage
- [x] Shared error classes: AppError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError, ExternalServiceError
- [x] Error middleware — maps AppError / Prisma errors / unknown to HTTP responses
- [x] Register endpoint: Zod validation, bcrypt, duplicate check, optional profile image
- [x] MinIO / S3 upload service with bucket auto-creation
- [x] Winston structured logger
- [x] Rate limiting: general + code execution
- [x] `helmet()` security headers
- [x] RESTful route naming (`/languages`, `/starter-code/:id` instead of verb-based names)
- [x] DTO enum type safety (`Language`, `problem_difficulty` properly typed through Zod)
- [x] `dotenv/config` loaded before any module-level code (fixes env var ordering bug)
- [x] `SALT_ROUNDS` validated in env schema
- [x] `PrismaService` uses shared singleton — no duplicate connections
- [x] All 18 test files moved to `__tests__/` subdirectories, 128/128 passing
- [x] Prisma scripts: `migrate:dev`, `migrate:reset`, `migrate:new`
- [x] Add `orderBy: { id: "asc" }` to test case queries
