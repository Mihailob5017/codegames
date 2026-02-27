# CodeGames — API Routes

All routes are prefixed with `/api/{API_VERSION}` where `API_VERSION` is set via environment variable.

---

## Code Execution

**Base path:** `/api/{version}/code`

| Method | Path                           | Handler                              | Description                        |
| ------ | ------------------------------ | ------------------------------------ | ---------------------------------- |
| GET    | `/health-check`                | CodeController.healthCheck           | Health check                       |
| GET    | `/get-languages`               | CodeController.getSupportedLanguages | List supported languages           |
| GET    | `/get-starter-code/:problemId` | CodeController.getStarterCode        | Get starter code for a problem     |
| POST   | `/run`                         | CodeController.runCode               | Run code against sample test cases |
| POST   | `/execute`                     | CodeController.executeCode           | Submit code against all test cases |

---

## Upload

**Base path:** `/api/{version}/upload`

| Method | Path           | Handler                       | Description                    |
| ------ | -------------- | ----------------------------- | ------------------------------ |
| POST   | `/:folder`     | UploadController.uploadFile   | Upload a single image          |
| POST   | `/:folder/bulk`| UploadController.uploadMultiple | Upload multiple images (max 10)|
| DELETE | `/`            | UploadController.deleteFile   | Delete an uploaded file         |

---

## Admin

**Base path:** `/api/{version}{ADMIN_ROUTE}`

The admin route prefix is a secret path set via the `ADMIN_ROUTE` environment variable. Auth middleware is not yet wired — security through obscurity only (see [roadmap](todo.md)).

### Health Check

| Method | Path            | Handler | Description                         |
| ------ | --------------- | ------- | ----------------------------------- |
| GET    | `/health-check` | inline  | Returns "Hello from CodeGames API!" |

### Problems

| Method | Path               | Handler                          | Description            |
| ------ | ------------------ | -------------------------------- | ---------------------- |
| GET    | `/problems`        | ProblemsController.getProblems   | List all problems      |
| GET    | `/problems/search` | ProblemsController.queryProblems | Search/filter problems |
| GET    | `/problems/:id`    | ProblemsController.getProblemById| Get problem by ID      |
| POST   | `/problems`        | ProblemsController.createProblem | Create a new problem   |
| PUT    | `/problems/:id`    | ProblemsController.updateProblem | Update a problem       |
| DELETE | `/problems/:id`    | ProblemsController.deleteProblem | Delete a problem       |

### Test Cases

| Method | Path                            | Handler                                     | Description                 |
| ------ | ------------------------------- | ------------------------------------------- | --------------------------- |
| GET    | `/problems/:id/test-cases`      | TestCasesController.getTestCasesByProblemId  | List test cases for problem |
| POST   | `/problems/:id/test-cases`      | TestCasesController.addTestCaseToProblem     | Add a single test case      |
| POST   | `/problems/:id/test-cases/bulk` | TestCasesController.bulkAddTestCasesToProblem| Add multiple test cases     |

### Starter Codes

| Method | Path                               | Handler                                            | Description            |
| ------ | ---------------------------------- | -------------------------------------------------- | ---------------------- |
| GET    | `/problems/:id/starter-codes`      | StarterCodesController.getStarterCodesByProblemId  | List starter codes     |
| POST   | `/problems/:id/starter-codes`      | StarterCodesController.addStarterCodeToProblem     | Add a single starter code |
| POST   | `/problems/:id/starter-codes/bulk` | StarterCodesController.bulkAddStarterCodesToProblem| Add multiple starter codes|

---

## Auth (planned — Phase 1)

**Base path:** `/api/{version}/user`

Currently stubbed out. See [technical decisions](technical-decisions.md#12-auth-strategy-planned) for the planned approach (JWT + refresh token rotation + OTP email verification + Google OAuth).

| Method | Path        | Handler | Status  | Description                     |
| ------ | ----------- | ------- | ------- | ------------------------------- |
| POST   | `/register` | —       | Stubbed | Register with email + password  |
| POST   | `/login`    | —       | Planned | Login, returns JWT + refresh    |
| POST   | `/logout`   | —       | Planned | Revoke refresh token            |
| POST   | `/refresh`  | —       | Planned | Rotate refresh token, new JWT   |
| POST   | `/verify`   | —       | Planned | Verify email with OTP           |
| GET    | `/profile`  | —       | Planned | Get current user profile        |
| PUT    | `/profile`  | —       | Planned | Update profile info/preferences |

---

## Planned Routes (Phase 1)

These routes will be added as MVP features are built.

### Public Problem Browsing

| Method | Path                  | Description                              |
| ------ | --------------------- | ---------------------------------------- |
| GET    | `/problems`           | List problems (paginated, filterable)    |
| GET    | `/problems/:slug`     | Get problem by slug (public view)        |
| GET    | `/problems/daily`     | Get today's problem of the day           |

### Submissions (requires auth)

| Method | Path                           | Description                         |
| ------ | ------------------------------ | ----------------------------------- |
| GET    | `/submissions`                 | List current user's submissions     |
| GET    | `/submissions/:id`             | Get a specific submission           |
| GET    | `/problems/:id/submissions`    | List submissions for a problem      |

### Leaderboard

| Method | Path                  | Description                              |
| ------ | --------------------- | ---------------------------------------- |
| GET    | `/leaderboard`        | Global leaderboard (paginated)           |
| GET    | `/leaderboard/weekly` | Weekly leaderboard                       |

---

## Planned Routes (Phase 2 — Super User)

| Method | Path                           | Description                              |
| ------ | ------------------------------ | ---------------------------------------- |
| POST   | `/practice-tests`              | Create a timed practice test             |
| GET    | `/practice-tests`              | List user's practice tests               |
| GET    | `/practice-tests/:id`          | Get practice test details                |
| POST   | `/practice-tests/:id/start`    | Start a test session                     |
| POST   | `/practice-tests/:id/end`      | End a test session                       |
| GET    | `/practice-tests/:id/analytics`| Get test analytics                       |
