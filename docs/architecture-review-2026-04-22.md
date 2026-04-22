# CodeGames Architecture Review

Date: 2026-04-22

## Scope

This review is based on:

- All Markdown files currently in the repo
- The backend and frontend source code
- Local verification of the current test/build state

Verification snapshot:

- `codegames-api` tests: 18 suites, 128 tests passing
- `codegames-web` build: passing
- `codegames-api` TypeScript build: failing because of `prisma.config.ts`

## Executive Summary

The project has a good foundation on the backend:

- Feature-based module layout is a strong choice
- Prisma, Zod, and custom error handling are good building blocks
- Test coverage on the current backend surface is solid
- The code execution slice is conceptually clean and separated well enough

The biggest issues are not “bad code” so much as architectural drift:

- The docs describe a broader, more mature system than the code currently implements
- The frontend no longer matches the backend contract
- Configuration and dependency management are inconsistent
- Several modules still rely on static classes and `process.env` access deep inside the app, which will become a maintenance problem as auth, submissions, and background workflows are added

## What Is Working Well

### 1. Backend vertical slices are the right direction

The `auth`, `code`, `admin`, `upload`, `middleware`, `infrastructure`, and `shared` split is understandable and scalable for this size of API.

### 2. Validation and error handling exist in the right places

Zod DTOs, custom `AppError` types, and centralized error middleware are good choices and should remain core conventions.

### 3. The code execution domain is reasonably isolated

`CodeRepository`, `CodePreparationService`, and `PistonService` separate concerns better than a single large execution service would.

### 4. Tests are ahead of the current implementation size

The backend has a better testing baseline than many projects at this stage. That reduces refactor risk.

## Main Findings

### High Priority

#### 1. Frontend and backend are out of sync

The frontend is still calling old or hardcoded routes:

- `codegames-web/src/App.tsx`
  - uses `/api/v1/admin_secret_route/problems`
  - uses `/api/v1/code/get-languages`
  - uses `/api/v1/code/get-starter-code/:id`

The backend currently exposes:

- `/api/{version}{ADMIN_ROUTE}/problems`
- `/api/{version}/code/languages`
- `/api/{version}/code/starter-code/:problemId`

Impact:

- The UI is coupled to old route names and a specific secret admin path
- Environment-driven routing is bypassed
- The frontend cannot be treated as a reliable client for the current API

Recommendation:

- Introduce a typed API client layer in the frontend
- Move route paths into one shared config file per app
- Replace direct fetches in `App.tsx` with feature-level client functions
- Stop calling admin endpoints from the user-facing app for problem browsing

#### 2. Backend build is broken

`codegames-api/prisma.config.ts` contains an `engine` property that causes `npm run build` to fail.

Impact:

- The API cannot pass a clean build check
- CI/CD and deployment confidence are weakened
- The repo currently gives a false sense of health because tests pass while compile/build is red

Recommendation:

- Fix `prisma.config.ts` first
- Make API build part of the standard verification gate
- Treat “tests pass but build fails” as a release blocker

#### 3. Dependency injection boundaries are weak

Examples:

- `codegames-api/code/code.controller.ts` creates `CodeService` statically using `process.env.PISTON_URL`
- `codegames-api/auth/auth.service.ts` uses static methods and static singleton dependencies
- Most controllers create their own services directly

Impact:

- Runtime config is not consistently injected from validated startup config
- Dependencies are harder to replace in tests
- Future additions like auth guards, submission persistence, background jobs, and metrics will increase coupling

Recommendation:

- Move to instance-based controllers/services
- Construct dependencies in one composition root
  - `index.ts`
  - `express-config.ts`
  - or dedicated module factories
- Pass validated config into infrastructure services instead of reading `process.env` throughout the codebase

#### 4. Documentation no longer reflects the real system

Examples:

- `docs/architecture.md` describes a `codegames-dashboard` app that is not present
- root `README.md` also references `codegames-dashboard`
- several docs describe missing CORS and timeout work that is already implemented
- the frontend README claims Redux, Router, Axios, Formik, and i18n stack usage, but the actual app is a single `App.tsx` using `fetch`

Impact:

- The repo communicates conflicting truths
- New contributors will optimize for the wrong system shape
- Architecture decisions are harder to trust

Recommendation:

- Split docs into:
  - `current-state`
  - `roadmap`
  - `historical-notes`
- Remove or clearly mark speculative architecture
- Keep READMEs tied to what is actually shipped in the repo today

### Medium Priority

#### 5. Validation is inconsistent across write endpoints

Good:

- `createProblem`
- auth register
- bulk insert DTOs
- code execution DTOs

Weak spots:

- `updateProblem` passes raw `req.body`
- single add test case endpoint passes raw `req.body`
- single add starter code endpoint passes raw `req.body`
- upload delete body is only manually checked

Impact:

- Standards are inconsistent across modules
- Invalid payloads can reach repositories and Prisma
- Error handling becomes partially schema-driven and partially accidental

Recommendation:

- Every write endpoint should have a DTO schema
- Add dedicated update schemas instead of accepting raw Prisma input shapes from HTTP
- Keep Prisma types inside the data layer, not as controller contract types

#### 6. Package/dependency hygiene needs cleanup

Examples from `codegames-api/package.json`:

- typo package `loadash`
- both `lodash` and `@types/lodash` are installed with no clear value shown in the current code
- `nodemon`, `supertest`, `ts-node`, `typescript`, and `prisma` are in runtime dependencies even though they are dev tooling

Impact:

- Larger production install surface
- Slower builds
- More attack surface and maintenance noise

Recommendation:

- Move dev-only tools to `devDependencies`
- remove unused packages
- delete accidental typo packages
- add a dependency review pass before the next release

#### 7. Router/module conventions are not fully consistent

Example:

- `codegames-api/auth/auth.route.ts` imports `Router` from the default `express` export instead of `{ Router }`

This works only because an Express sub-app can be mounted, but it is not the intended router pattern and increases inconsistency.

Recommendation:

- Standardize route files on `import { Router } from "express"`
- Standardize module exports so every feature follows the same shape

#### 8. Logging and observability are too thin for the planned product

Current request logging only logs method and path.

Missing:

- response status
- duration
- request id / correlation id
- user id where applicable
- structured external-service failure context

Recommendation:

- Add request ids
- log completion, not only request start
- capture latency for Piston and database-sensitive operations

### Low Priority

#### 9. Naming debt in the schema should be cleaned up before broader expansion

Example:

- `constrains` should likely be `constraints`

This is not urgent, but if left as-is it will spread into DTOs, APIs, frontend models, and docs.

#### 10. The frontend is still a prototype, not a scalable app architecture

Current signs:

- one large component
- direct `fetch` calls inline
- inline styles
- alerts for UX feedback
- no feature decomposition

Recommendation:

- If frontend work is starting soon, define a real app structure now:
  - `features/`
  - `components/`
  - `api/`
  - `hooks/`
  - `types/`
- Decide whether Redux/Router/i18n are really needed now or should be removed until used

## Recommended Target Architecture

### Backend

- Keep the vertical-slice module structure
- Add a composition root for wiring dependencies
- Keep controllers thin
- Keep services focused on business rules
- Keep repositories focused on Prisma/database access
- Keep DTO/Zod schemas at the module boundary
- Do not pass raw Prisma input types directly from controllers into services

Suggested pattern:

1. Validate request with Zod
2. Convert into app-level input type
3. Call service with injected dependencies
4. Service orchestrates repositories/external clients
5. Repository owns Prisma queries only

### Frontend

- Create separate public and admin clients instead of using raw route strings everywhere
- Stop using the admin API from the public app for problem listing
- Add route/config abstraction for API version and admin prefix
- Break `App.tsx` into problem list, problem detail, editor, and run-result features

### Documentation

- `README.md`: only current repo reality
- `docs/architecture.md`: current implementation only
- `docs/roadmap.md`: future scope
- session logs and experiments in a separate historical folder

## Suggested Change Plan

### Phase 1: Stability

- Fix `codegames-api` build
- Fix frontend route drift
- clean package.json dependencies
- update docs to reflect current state

### Phase 2: Architecture hardening

- Introduce dependency injection/composition root
- remove deep `process.env` reads from feature code
- add DTOs for every write endpoint
- standardize router/controller/service patterns

### Phase 3: Product-aligned expansion

- implement public problem endpoints for the web app
- add auth guards and role guards
- add submission persistence and user progress models
- only then expand leaderboard, profile, and dashboard features

## Bottom Line

The backend foundation is promising and the repo is not in bad shape. The main risk is that the project is evolving faster in docs and plans than in its runtime architecture. The next best move is not a large rewrite. It is to tighten the contracts:

- one source of truth for routes and config
- one consistent dependency wiring pattern
- one accurate set of docs
- one green verification pipeline that includes both tests and builds

If those are fixed first, the rest of the roadmap becomes much safer to implement.
