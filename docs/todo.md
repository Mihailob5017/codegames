# CodeGames — TODO

## Security (do before launch)

- [ ] Wire up `helmet()` in express-config.ts — security headers (CSP, HSTS, X-Frame-Options, etc.)
- [ ] Wire up `cors({ origin: CORS_ORIGIN })` in express-config.ts — currently any origin can hit the API
- [ ] Wire up `express-rate-limit` in express-config.ts — code execution endpoint is fully open to abuse
- [ ] Implement auth (JWT + refresh token rotation + OTP email) — all packages installed, nothing wired
- [ ] Add auth middleware to protect admin routes — currently only a secret URL path
- [ ] Add Zod validation to `PUT /problems/:id` — raw req.body passed directly to Prisma
- [ ] Add Zod validation to `POST /problems/:id/test-cases` (non-bulk) — no validation on body
- [ ] Add Zod validation to `POST /problems/:id/starter-codes` (non-bulk) — no validation on body
- [ ] Add `AbortSignal.timeout(10_000)` to Piston fetch call — currently hangs forever if Piston is unresponsive
- [ ] Add `USER node` directive to Dockerfile — container runs as root

## Performance

- [x] Add index on `test_cases.problemId`
- [x] Add `orderBy: { id: "asc" }` to test case queries — prevents stdout/expected mismatch if row order changes
- [ ] Add pagination (`take`/`skip`) to `getAllProblems` and `queryProblems`

## Infrastructure

- [ ] Create a production Dockerfile (multi-stage build, `npm run build`, non-root user) — currently runs `nodemon` in production
- [ ] Move `nodemon`, `ts-node`, `supertest` from `dependencies` to `devDependencies`
- [ ] Remove `loadash` (typo duplicate of `lodash`) from dependencies
- [ ] Pin `wait-for-it.sh` download to a specific commit hash in Dockerfile

## Optional Features

- [ ] **Solution diagram** — draw/sketch your approach before coding (tldraw-style whiteboard embedded in the problem page)
- [ ] **Practice problems with timer** — pick a problem, set a time limit, and practice under pressure
- [ ] **Study plans** — curated, ordered sequences of problems (e.g. "Blind 75", "Two Pointers Mastery")
- [ ] **Shareable tests** — create a test (1–5 problems, custom time limit) and share it via link
  - [ ] Anonymous mode — recipient solves without an account, sees results only
  - [ ] Authenticated mode — recipient logs in, results count towards their total score
- [ ] **Custom test cases** — let users type their own inputs to debug against (runs through Piston, doesn't count as a submission)
- [ ] **Solution playback** — record keystrokes/diffs during a solve attempt so users can replay their thought process
- [ ] **Pattern labels** — after solving, reveal the underlying pattern (sliding window, two pointers, etc.) with a link to the relevant study plan
- [ ] **Dark mode** — theme toggle with Monaco editor theme sync
- [ ] **Keyboard shortcuts** — vim/emacs keybindings toggle in Monaco, global shortcuts (Ctrl+Enter to run, Ctrl+Shift+Enter to submit)
- [ ] **Problem recommendations** — suggest problems based on solve history and failure patterns ("you struggled with sliding window, try these next")
- [ ] **Collaborative solving** — real-time pair programming on a problem via shared Monaco session (WebSocket)
- [ ] **Solution comparison** — after accepted submission, show time/space complexity ranking against other users (distribution chart)
- [ ] **Quiz mode** — non-coding questions (multiple choice, true/false, fill-in-the-blank) for testing theory knowledge (Big-O, data structure trade-offs, system design concepts). Can be mixed into study plans and shareable tests alongside coding problems

## Nice to Have (later)

- [ ] Async code execution with a job queue (BullMQ) — only if Piston latency becomes an issue
- [ ] Refresh token cleanup cron job — delete expired tokens periodically once auth is implemented
- [ ] Request logger improvements — log response status, duration, and user identity
