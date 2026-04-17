# CodeGames — Roadmap

> Organised by release scope. Each phase builds on the previous one.

---

## Phase 1 — MVP (1.0)

The core loop: browse problems, write code, run/submit, see results.

### Auth & Users

- [ ] Wire up auth (JWT + refresh token rotation + OTP email verification)
- [ ] Anonymous browsing — anyone can view problems and attempt to solve, but nothing is tracked
- [ ] Logged-in users get: tracked submissions, leaderboard ranking, streaks, problem of the day
- [ ] Google OAuth login
- [ ] Profile page: activity heatmap (GitHub-style dots), leaderboard position, preferences, editable info
- [ ] User preferences: default language, light/dark theme

### Problems & Code Execution

- [ ] Problem CRUD (admin only): name, description, type/category, difficulty, hints, constraints, examples
- [ ] Starter code per language (separate table)
- [ ] Test cases: sample (visible) + hidden (submit-only) (separate table)
- [ ] Solutions per language with explanation + time/space complexity (separate table)
- [ ] Company tags — which companies ask this problem (Microsoft, Amazon, Google, etc.)
- [ ] Search problems by name/category/difficulty
- [ ] Filter problems by the same criteria
- [ ] Run code: fails on first test → return expected vs actual; passes first test → return full test results object (pass/fail per case)
- [ ] Submit code: runs all test cases, tracks submission
- [ ] Problem stats: total attempts, total accepted, acceptance rate, per-user solved/attempted state
- [ ] Problem of the day

### Drawing / Whiteboard

- [ ] tldraw-style canvas on the problem page — sketch your approach before coding

### Leaderboard

- [ ] Global leaderboard ranked by problems solved (weighted by difficulty)
- [ ] Streak tracking — consecutive days solving at least one problem

### Admin

- [ ] Separate admin dashboard
- [ ] CRUD users, problems, test cases, starter codes, solutions
- [ ] Analytics inside the dashboard

### Security & Infra (do before launch)

- [ ] Wire up `helmet()` — security headers (CSP, HSTS, X-Frame-Options)
- [ ] Wire up `cors({ origin: CORS_ORIGIN })` — restrict origins
- [ ] Wire up `express-rate-limit` — especially on code execution endpoints
- [ ] Add auth middleware to protect admin routes (currently secret URL only)
- [ ] Add Zod validation to all unvalidated endpoints (`PUT /problems/:id`, non-bulk test cases, non-bulk starter codes)
- [ ] Add `AbortSignal.timeout(10_000)` to Piston fetch call
- [ ] Add `USER node` directive to Dockerfile (currently runs as root)
- [ ] Create production Dockerfile (multi-stage build, `npm run build`, non-root user)
- [ ] Move dev-only deps (`nodemon`, `ts-node`, `supertest`) to `devDependencies`
- [ ] Pin `wait-for-it.sh` download to a specific commit hash

---

## Phase 2 — Super User (2.0)

Paid subscription tier with test creation and analytics.

### Super User Features

- [ ] Monthly subscription model (payment integration TBD)
- [ ] Super user mini dashboard
- [ ] Create timed tests: pick problems, set a time limit
- [ ] Choose required algorithm/category for test problems
- [ ] Test generation via algorithm (auto-select problems matching criteria)
- [ ] Test analytics: attempts, failures, code typed, per-problem breakdown
- [ ] Limit problem visibility within a test (enable/disable solutions, hints)

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

- [x] Add index on `test_cases.problemId`
- [x] Add `orderBy: { id: "asc" }` to test case queries
