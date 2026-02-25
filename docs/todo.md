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

## Nice to Have (later)

- [ ] Async code execution with a job queue (BullMQ) — only if Piston latency becomes an issue
- [ ] Refresh token cleanup cron job — delete expired tokens periodically once auth is implemented
- [ ] Request logger improvements — log response status, duration, and user identity
