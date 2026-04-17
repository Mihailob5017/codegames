# API Restructure Design

**Date:** 2026-04-16
**Scope:** `codegames-api/` directory restructuring + Prisma DX scripts

---

## Goals

1. Adopt a clean vertical-slice (feature module) layout with a `shared/` layer for cross-cutting concerns
2. Extract `auth/` as its own module separate from `user/`
3. Fix one naming inconsistency in the `code/` module
4. Add developer-friendly Prisma npm scripts

---

## 1. Directory Layout

### New structure

```text
codegames-api/
├── admin/                            (unchanged)
├── auth/                             (new)
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.repository.ts
│   ├── auth.dto.ts
│   ├── auth.route.ts
│   └── index.ts
├── code/
│   ├── code.controller.ts            (unchanged)
│   ├── code.dto.ts                   (unchanged)
│   ├── code.repository.ts            (unchanged)
│   ├── code.route.ts                 (unchanged)
│   ├── code.service.ts               (unchanged)
│   ├── code-preparation.service.ts   (renamed from wrapper.service.ts)
│   ├── piston.service.ts             (unchanged)
│   └── index.ts                      (unchanged)
├── infrastructure/                   (unchanged)
├── middleware/                       (unchanged)
├── shared/
│   ├── errors/
│   │   ├── app-error.ts              (moved from errors/)
│   │   └── app-error.test.ts         (moved)
│   ├── types/
│   │   └── common.types.ts           (moved from types/)
│   └── test-utils/
│       └── test-helpers.ts           (moved from __tests__/utils/)
├── upload/                           (unchanged)
├── user/                             (slimmed — profile placeholder only)
│   ├── user.controller.ts
│   ├── user.service.ts
│   ├── user.repository.ts
│   ├── user.dto.ts
│   ├── user.route.ts
│   └── index.ts
├── index.ts
└── prisma.config.ts
```

### Deleted root folders

- `errors/` — contents moved to `shared/errors/`
- `types/` — contents moved to `shared/types/`
- `__tests__/` — contents moved to `shared/test-utils/`

---

## 2. Auth / User Split

### auth/ module

Owns all identity and credential concerns.

| File | Responsibility | Source |
|------|---------------|--------|
| `auth.dto.ts` | `CreateUserSchema` + `CreateUserInput` type | Moved from `user/user.dto.ts` |
| `auth.repository.ts` | `registerUser()` Prisma call | Moved from `user/user.repository.ts` |
| `auth.service.ts` | Password hashing, S3 avatar upload, registration orchestration | Moved from `user/user.service.ts` |
| `auth.controller.ts` | `POST /register` request handler | Moved from `user/user.controller.ts` |
| `auth.route.ts` | Route definitions, multer middleware | Moved from `user/user.route.ts` |
| `index.ts` | Barrel export of `authRouter` | New |

Route prefix changes from `/api/v1/user` → `/api/v1/auth`.

### user/ module

Becomes a placeholder for future profile/account endpoints. No logic yet.

| File | Responsibility |
|------|---------------|
| `user.repository.ts` | `findById()` stub (user reads needed soon) |
| `user.controller.ts` | Empty — future profile endpoints |
| `user.service.ts` | Empty — future profile logic |
| `user.dto.ts` | Empty — future profile DTOs |
| `user.route.ts` | Empty router export |
| `index.ts` | Barrel export of `userRouter` |

### infrastructure/express-config.ts

- Import `authRouter` from `auth/` instead of `userRouter` from `user/`
- Mount at `/api/${API_VERSION}/auth`

---

## 3. Code Module Rename

| Before | After | Reason |
|--------|-------|--------|
| `code/wrapper.service.ts` | `code/code-preparation.service.ts` | Name reflects actual responsibility (code wrapping/preparation), consistent with `<module>.<role>.ts` convention |

All internal imports updated accordingly. `piston.service.ts` stays unchanged.

---

## 4. Prisma Scripts

Added to `package.json` `scripts`:

```json
"migrate:dev":   "prisma migrate dev",
"migrate:reset": "prisma migrate reset",
"migrate:new":   "prisma migrate dev --create-only --name"
```

| Script | Command | Use case |
|--------|---------|----------|
| `npm run migrate:dev` | `prisma migrate dev` | Apply pending migrations in development |
| `npm run migrate:reset` | `prisma migrate reset` | Wipe DB, re-run all migrations, re-seed |
| `npm run migrate:new -- <name>` | `prisma migrate dev --create-only --name <name>` | Create a blank named migration file |

The existing `seed` script is unchanged.

---

## 5. Import Path Updates

All files that currently import from `../errors/`, `../types/`, `__tests__/utils/` will be updated to `../shared/errors/`, `../shared/types/`, `../shared/test-utils/` respectively.

All files importing `wrapper.service.ts` will be updated to `code-preparation.service.ts`.

---

## 6. Code Quality Fixes

### Real bugs

| # | Location | Issue | Fix |
|---|----------|-------|-----|
| 1 | `infrastructure/prisma.ts` + `infrastructure/prisma-config.ts` | Two separate `PrismaClient` instances — repositories use the singleton in `prisma.ts`; `PrismaService` manages lifecycle on its own separate instance. `disconnect()` on shutdown disconnects the wrong client. | `PrismaService` wraps the singleton from `prisma.ts` instead of creating its own client. |
| 2 | `infrastructure/prisma-config.ts` `connect()` | Uses `.then().catch()` without `await` — DB connection failures are caught and logged but not rethrown, so `startServer()` never knows and the server boots with a broken DB connection. | Replace with `await this.client.$connect()` so errors propagate to `startServer()`. |

### Code quality

| # | Location | Issue | Fix |
|---|----------|-------|-----|
| 3 | `code/code.service.ts` | `run()` and `execute()` are near-identical — same logic, only differ in which test cases they fetch. | Extract private `_runWithTestCases(body, testCases)` method; both public methods call it. |
| 4 | `code/code.service.ts` | `run()` returns `Promise<RunResult or any>` (effectively `any`); `execute()` returns `Promise<any>`. | Both return `Promise<RunResult>`. |
| 5 | `user/user.service.ts` + `infrastructure/env-config.ts` | `SALT_ROUNDS` read via `parseInt(process.env.SALT_ROUNDS!)` without validation — if unset, bcrypt receives `NaN` and throws at runtime. | Add `SALT_ROUNDS` to `env-config.ts` schema with numeric transformation and minimum value check. |
| 6 | `infrastructure/prisma-config.ts` | Uses `console.log` / `console.error` while the rest of the codebase uses the Winston logger. | Replace with `logger.info` / `logger.error` from `infrastructure/logger.ts`. |
| 7 | `middleware/rate-limit-middleware.ts` | `generalRateLimiter` uses the legacy `max` option; `codeSubmissionRateLimiter` uses the current `limit`. Inconsistent. | Use `limit` in both. |
| 8 | `code/code.controller.ts` | `CodeService` instantiated as a static field at class-load time (`new CodeService(process.env.PISTON_URL!)`), before `validateEnv()` runs — missing `PISTON_URL` fails silently. | Instantiate `CodeService` after env validation in `infrastructure/express-config.ts` and pass it to the controller. |
| 9 | `shared/errors/app-error.ts` | No `UnauthorizedError` (401) or `ForbiddenError` (403) classes — required as soon as JWT middleware is added for auth. | Add both classes to `app-error.ts`. |
| 10 | `code/code.route.ts` | `/get-languages` and `/get-starter-code/:problemId` use verbs in URLs, which is not RESTful. | Rename to `/languages` and `/starter-code/:problemId`. |

---

## Out of Scope

- No changes to `admin/`, `upload/` internals
- No `src/` wrapper introduced
- No login/logout/refresh endpoints (future work)
- No changes to Prisma schema or migrations
