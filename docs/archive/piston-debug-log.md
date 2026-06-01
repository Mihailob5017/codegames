# Piston Language Support — Debug Log

> Historical debug log from early development. Kept as reference for the install-name vs runtime-name distinction. Runtimes now auto-install via the custom entrypoint — see [docker.md](docker.md).

---

## Problem

Only JavaScript worked. Python, Java, and C++ all returned `500 Internal Server Error`.

## Root Causes

### 1. Missing runtimes

Piston ships with zero language runtimes. Each must be installed via `POST /api/v2/packages`. Only `node` had been installed.

**Resolution:** Runtimes are now auto-installed by `piston/piston-entrypoint.sh` on container startup.

### 2. Wrong Python language identifier

`piston.service.ts` used `"python3"` — Piston registers the runtime as `"python"`.

```ts
// Before
PYTHON: { language: "python3", version: "3.12.0" }

// After
PYTHON: { language: "python", version: "3.12.0" }
```

### 3. Install name vs runtime name (C++)

The package install name and runtime name can differ. C++ installs as `"gcc"` but registers as `"c++"`.

```bash
# Installing uses "gcc"
curl -X POST .../packages -d '{"language": "gcc", ...}'

# Executing uses "c++"
curl -X POST .../execute  -d '{"language": "c++", ...}'
```

## Key Takeaway

Always check `GET /api/v2/runtimes` to find the correct runtime name. The install package name is not always the same.

```bash
curl http://localhost:2000/api/v2/runtimes | jq '[.[] | {language, version}]'
```
