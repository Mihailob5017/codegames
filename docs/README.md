# CodeGames — Documentation

Index of the project's living documentation. These docs describe the **current
state** of the system; the roadmap tracks what's next, and `archive/` keeps
point-in-time notes that are no longer active references.

## Living docs

| Doc | What it covers |
|-----|----------------|
| [architecture.md](architecture.md) | System design, module responsibilities, data-flow diagrams, env vars, security model |
| [schema-design.md](schema-design.md) | Database schema design and feature inventory by phase |
| [technical-decisions.md](technical-decisions.md) | ADR-style record of every significant architectural choice and its reasoning |
| [api-routes.md](api-routes.md) | API route reference (✅ implemented / 🔲 planned / 🚧 partial) |
| [docker.md](docker.md) | Docker Compose setup and service topology |
| [upload-service.md](upload-service.md) | MinIO/S3 upload service — how uploads work end to end |
| [roadmap.md](roadmap.md) | Single source of truth for done / next work + cross-cutting tech debt |

## Reviewing the codebase

Run **`/architecture-review`** (defined in `.claude/commands/architecture-review.md`)
to audit the code against the standards documented here — layering, consistency,
validation, error handling, test coverage, and doc/code drift. It produces a
prioritised findings report and does **not** add features.

## Archive

`archive/` holds historical, point-in-time documents kept for reference:

- `architecture-review-2026-04-22.md` — snapshot review (superseded by `/architecture-review`)
- `session-2026-04-16-17.md` — work log from the April restructure
- `piston-debug-log.md` — early Piston language-support debugging notes
- `superpowers/` — the design spec and plan for the April API restructure

When a living doc's content stops being a current-state reference, move it here
rather than deleting it.
