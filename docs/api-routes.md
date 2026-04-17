# CodeGames — API Routes

All routes are prefixed with `/api/{API_VERSION}` where `API_VERSION` is set via environment variable (e.g. `v1`).

Legend: ✅ Implemented · 🔲 Planned · 🚧 Partial

---

## Auth

**Base path:** `/api/{version}/auth`

| Method | Path | Handler | Status | Description |
| ------ | ---- | ------- | ------ | ----------- |
| POST | `/register` | `AuthController.register` | ✅ | Register with email + password + optional profile image |
| POST | `/login` | — | 🔲 | Login, returns JWT access token + refresh token |
| POST | `/logout` | — | 🔲 | Revoke refresh token |
| POST | `/refresh` | — | 🔲 | Rotate refresh token, issue new JWT |
| POST | `/verify` | — | 🔲 | Verify email with OTP |
| POST | `/forgot-password` | — | 🔲 | Request password reset OTP |
| POST | `/reset-password` | — | 🔲 | Confirm reset with OTP + new password |
| POST | `/google` | — | 🔲 | Google OAuth login/register |

**Register request body:**
```json
{
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "Secret1!",
  "country": "US"
}
```
Password rules: min 8 chars, at least one uppercase, lowercase, digit, and special character.
Optional: `profileImage` as `multipart/form-data` field.

---

## Code Execution

**Base path:** `/api/{version}/code`

| Method | Path | Handler | Status | Description |
| ------ | ---- | ------- | ------ | ----------- |
| GET | `/health-check` | `CodeController.healthCheck` | ✅ | Service health check |
| GET | `/languages` | `CodeController.getSupportedLanguages` | ✅ | List supported languages |
| GET | `/starter-code/:problemId` | `CodeController.getStarterCode` | ✅ | Get starter code per language for a problem |
| POST | `/run` | `CodeController.runCode` | ✅ | Run code against sample test cases only |
| POST | `/execute` | `CodeController.executeCode` | ✅ | Submit code against all test cases |

`/run` and `/execute` are rate-limited to **10 requests per minute** per IP.

**Request body (`/run` and `/execute`):**
```json
{
  "code": "function twoSum(nums, target) { ... }",
  "language": "JAVASCRIPT",
  "problemId": "clxyz123"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "allPassed": true,
    "total": 3,
    "passed": 3,
    "failed": 0,
    "results": [
      { "id": "tc1", "passed": true, "expected": "[0,1]", "actual": "[0,1]" }
    ]
  }
}
```

Supported languages: `PYTHON` · `JAVASCRIPT` · `JAVA` · `CSHARP` · `CPP`

---

## User Profile

**Base path:** `/api/{version}/user`

> Not yet implemented. Auth guard required (JWT).

| Method | Path | Handler | Status | Description |
| ------ | ---- | ------- | ------ | ----------- |
| GET | `/profile` | — | 🔲 | Get current user's profile |
| PUT | `/profile` | — | 🔲 | Update profile info and preferences |
| GET | `/profile/stats` | — | 🔲 | Submission count, streaks, solve history |
| GET | `/profile/submissions` | — | 🔲 | List current user's submissions |

---

## Problems (Public)

**Base path:** `/api/{version}/problems`

> Not yet implemented. Public — no auth required for browse/run.

| Method | Path | Handler | Status | Description |
| ------ | ---- | ------- | ------ | ----------- |
| GET | `/` | — | 🔲 | List problems (paginated, filterable by difficulty/category) |
| GET | `/daily` | — | 🔲 | Get today's problem of the day |
| GET | `/:slug` | — | 🔲 | Get problem detail by slug (public view, no hidden test cases) |

---

## Submissions

**Base path:** `/api/{version}/submissions`

> Not yet implemented. Auth required.

| Method | Path | Handler | Status | Description |
| ------ | ---- | ------- | ------ | ----------- |
| GET | `/` | — | 🔲 | List current user's submissions (paginated) |
| GET | `/:id` | — | 🔲 | Get a specific submission |
| GET | `/problems/:id` | — | 🔲 | List all submissions for a problem (current user) |

---

## Leaderboard

**Base path:** `/api/{version}/leaderboard`

> Not yet implemented. Read from `LeaderboardSnapshot` table (materialized by cron).

| Method | Path | Handler | Status | Description |
| ------ | ---- | ------- | ------ | ----------- |
| GET | `/` | — | 🔲 | Global leaderboard (paginated) |
| GET | `/weekly` | — | 🔲 | Current week's leaderboard |
| GET | `/monthly` | — | 🔲 | Current month's leaderboard |

---

## Upload

**Base path:** `/api/{version}/upload`

| Method | Path | Handler | Status | Description |
| ------ | ---- | ------- | ------ | ----------- |
| POST | `/:folder` | `UploadController.uploadFile` | ✅ | Upload a single file to MinIO |
| POST | `/:folder/bulk` | `UploadController.uploadMultiple` | ✅ | Upload up to 10 files |
| DELETE | `/` | `UploadController.deleteFile` | ✅ | Delete an uploaded file |

---

## Admin

**Base path:** `/api/{version}{ADMIN_ROUTE}`

The admin prefix is a secret path from the `ADMIN_ROUTE` env var. Role-based auth guard is planned but not yet wired — currently protected by route obscurity only.

### Health Check

| Method | Path | Status | Description |
| ------ | ---- | ------ | ----------- |
| GET | `/health-check` | ✅ | Returns API health |

### Problems

| Method | Path | Handler | Status | Description |
| ------ | ---- | ------- | ------ | ----------- |
| GET | `/problems` | `ProblemsController.getProblems` | ✅ | List all problems |
| GET | `/problems/search` | `ProblemsController.queryProblems` | ✅ | Filter by difficulty / category / published / search text |
| GET | `/problems/:id` | `ProblemsController.getProblemById` | ✅ | Get problem with full detail |
| POST | `/problems` | `ProblemsController.createProblem` | ✅ | Create problem (with nested test cases + starter codes) |
| PUT | `/problems/:id` | `ProblemsController.updateProblem` | ✅ | Update problem fields |
| DELETE | `/problems/:id` | `ProblemsController.deleteProblem` | ✅ | Hard delete problem |

**Query params for `/problems/search`:**
- `difficulty` — `EASY` | `MEDIUM` | `HARD`
- `isPublished` — `true` | `false`
- `categories` — comma-separated: `ARRAYS,STRINGS`
- `search` — free-text search on title and slug

### Test Cases

| Method | Path | Handler | Status | Description |
| ------ | ---- | ------- | ------ | ----------- |
| GET | `/problems/:id/test-cases` | `TestCasesController.getTestCasesByProblemId` | ✅ | List test cases |
| POST | `/problems/:id/test-cases` | `TestCasesController.addTestCaseToProblem` | ✅ | Add one test case |
| POST | `/problems/:id/test-cases/bulk` | `TestCasesController.bulkAddTestCasesToProblem` | ✅ | Add multiple test cases |

### Starter Codes

| Method | Path | Handler | Status | Description |
| ------ | ---- | ------- | ------ | ----------- |
| GET | `/problems/:id/starter-codes` | `StarterCodesController.getStarterCodesByProblemId` | ✅ | List starter codes |
| POST | `/problems/:id/starter-codes` | `StarterCodesController.addStarterCodeToProblem` | ✅ | Add one starter code |
| POST | `/problems/:id/starter-codes/bulk` | `StarterCodesController.bulkAddStarterCodesToProblem` | ✅ | Add multiple starter codes |

---

## Super User — Practice Tests (Phase 2)

**Base path:** `/api/{version}/practice-tests`

> Requires `SUPER_USER` role. Not yet implemented.

| Method | Path | Status | Description |
| ------ | ---- | ------ | ----------- |
| POST | `/` | 🔲 | Create a timed practice test |
| GET | `/` | 🔲 | List user's practice tests |
| GET | `/:id` | 🔲 | Get test detail |
| POST | `/:id/share` | 🔲 | Generate shareable deeplink |
| POST | `/:id/start` | 🔲 | Start a test session (records start time) |
| POST | `/:id/end` | 🔲 | End a session (records end time, calculates score) |
| GET | `/:id/analytics` | 🔲 | Per-problem breakdown, attempt counts, time spent |

---

## Error Response Format

All errors return a consistent shape:

```json
{
  "status": "error",
  "message": "Resource not found"
}
```

For validation errors with field details:
```json
{
  "status": "error",
  "message": {
    "email": ["Invalid email format"],
    "password": ["Must contain at least one uppercase letter"]
  }
}
```

| HTTP Status | Meaning |
|-------------|---------|
| 400 | Validation error or bad request |
| 401 | Unauthenticated (no/invalid JWT) |
| 403 | Forbidden (wrong role) |
| 404 | Resource not found |
| 409 | Conflict (duplicate username/email) |
| 429 | Rate limit exceeded |
| 502 | Piston (external service) error |
| 500 | Unexpected server error |
