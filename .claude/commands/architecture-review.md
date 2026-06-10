# Architecture Review

Act as the project's software architect. Audit the codebase against the standards
below and produce a prioritised findings report. **Do not add features** — this
review exists to keep the foundation clean so new features can be built on top of
it. If asked to fix findings, only apply consistency/standards/test/doc fixes.

## How to run the review

1. Read every source file under `codegames-api/` (skip `node_modules`, `dist`,
   `coverage`, `piston/packages`). The codebase is small enough to read in full —
   do not sample.
2. Run the verification suite and treat failures as P0 findings:
   - `npx tsc --noEmit` (typecheck)
   - `npm run lint` (warnings count as findings)
   - `npm run format:check`
   - `npx jest --coverage`
3. Compare the code against the standards below and against `docs/` (drift in
   either direction is a finding).
4. Report findings grouped by priority:
   - **P0 — broken**: failing checks, dead code paths, bugs (e.g. a null check on
     a `findMany` result that can never be null)
   - **P1 — standards violations**: anything that contradicts a rule below
   - **P2 — drift & polish**: doc/code mismatches, naming, dead files, dep hygiene

## Standards to enforce

### Layering (per feature slice)

Every feature slice (`auth/`, `code/`, `user/`, `upload/`, `admin/*`) follows:

```
<slice>.route.ts       → route definitions only; applies middleware; no logic
<slice>.controller.ts  → static class; parses/validates input; calls service; shapes HTTP response
<slice>.service.ts     → instance class; business logic; constructs its dependencies in the constructor
<slice>.repository.ts  → instance class; the ONLY layer that touches prisma
<slice>.dto.ts         → Zod schemas + inferred types; the HTTP contract
index.ts               → barrel: exports the router and the slice's classes
```

- Controllers never import `prisma`. Services never touch `req`/`res`.
  Repositories contain no business logic.
- Cross-slice imports go through the other slice's public surface (e.g.
  `AuthService` may use `UploadService`), never its repository.

### Conventions

- **Exports**: classes are `export default`; routers are named exports
  (`export const xRouter`). Every slice has an `index.ts` barrel.
- **Validation**: every endpoint that reads `req.body` or `req.query` validates
  with a Zod schema via `safeParse`, throwing
  `ValidationError(message, z.flattenError(error).fieldErrors)` on failure.
  Never `.parse()` in a controller, never expose Prisma input types as the HTTP
  contract.
- **Errors**: throw the most specific subclass from `shared/errors/app-error.ts`
  (`NotFoundError`, `ConflictError`, `ValidationError`, …) — never
  `new AppError(msg, code)` directly, never raw `Error` for operational failures.
  All HTTP error shaping lives in `middleware/error-middleware.ts`.
- **Config**: runtime code reads config only via `getAppConfig()`. Direct
  `process.env` reads are allowed only in the documented bootstrap exceptions
  (`infrastructure/logger.ts`, `infrastructure/prisma.ts`, the production guard
  in `error-middleware.ts`) and `index.ts` before validation.
- **Logging**: use the Winston `logger`, not `console.*` (the pre-validation
  startup failure path in `index.ts` is the one exception).
- **HTTP responses**: success is `{ status: "success", data | message, ... }`;
  errors are `{ status: "error", message }`. Status codes: 201 create,
  200 read/update/delete.
- **Style**: Prettier owns formatting (tabs, width 80); ESLint must be clean —
  treat warnings as findings.

### Testing

- Every controller, service, and repository with real logic has a test file
  under the slice's `__tests__/` directory. Placeholder stubs (e.g. `user/`)
  are exempt until implemented.
- Tests mock at module level with `jest.mock()`; controller tests use
  `createMockRequest/Response/Next` from `shared/test-utils/test-helpers`;
  config-dependent code calls `initTestAppConfig()`.
- Repository tests mock the `prisma` singleton; they assert the exact query
  shape (where/select/orderBy).
- `jest.config.js` must keep `collectCoverageFrom` covering all source files so
  untested files cannot hide from the coverage report.
- Coverage target: ≥85% statements overall; any non-stub file below 50% is a
  P1 finding.

### Dependencies & repo hygiene

- `dependencies` = runtime only. Build/dev tooling (`typescript`, `ts-node`,
  `nodemon`, `prisma` CLI, test libs, `@types/*`) belongs in `devDependencies`.
- No unused dependencies (verify with grep before flagging).
- No stray/empty directories, committed build output, or editor/agent settings
  inside source folders.

### Documentation (docs/ is the single home)

- `docs/README.md` indexes every living doc; `docs/archive/` holds superseded
  material — move, don't delete.
- Docs describe **current state**; planned work lives only in `docs/roadmap.md`.
  Anything speculative inside another doc must be labelled "planned".
- Check for drift both ways: endpoints/env vars/behaviour described in docs must
  match code (names, defaults, validation rules); new code must be reflected in
  `docs/api-routes.md` and `docs/architecture.md`.
- `README.md` (root) links and project-structure tree must point at files that
  exist.

## Output format

End with a summary table: finding · priority · file(s) · one-line fix. If the
user asked for fixes, apply P0/P1 (and cheap P2s), re-run the verification
suite, and update `docs/roadmap.md` checkboxes + the "Last updated" date.
