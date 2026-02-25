# CodeGames — API Routes

All routes are prefixed with `/api/{API_VERSION}` where `API_VERSION` is set via environment variable.

---

## Code Execution

**Base path:** `/api/{version}/code`

| Method | Path                           | Handler                              | Description                        |
|--------|--------------------------------|--------------------------------------|------------------------------------|
| GET    | `/health-check`                | CodeController.healthCheck           | Health check                       |
| GET    | `/get-languages`               | CodeController.getSupportedLanguages | List supported languages           |
| GET    | `/get-starter-code/:problemId` | CodeController.getStarterCode        | Get starter code for a problem     |
| POST   | `/run`                         | CodeController.runCode               | Run code against sample test cases |
| POST   | `/execute`                     | CodeController.executeCode           | Submit code against all test cases |

---

## Admin

**Base path:** `/api/{version}{ADMIN_ROUTE}`

The admin route prefix is a secret path set via the `ADMIN_ROUTE` environment variable. There is no auth middleware yet — security through obscurity only (see [TODO](todo.md)).

### Health Check

| Method | Path            | Handler      | Description |
|--------|-----------------|--------------|-------------|
| GET    | `/health-check` | inline       | Returns "Hello from CodeGames API!" |

### Problems

| Method | Path              | Handler                         | Description              |
|--------|-------------------|---------------------------------|--------------------------|
| GET    | `/problems`       | ProblemsController.getProblems  | List all problems        |
| GET    | `/problems/search`| ProblemsController.queryProblems| Search/filter problems   |
| GET    | `/problems/:id`   | ProblemsController.getProblemById| Get problem by ID       |
| POST   | `/problems`       | ProblemsController.createProblem| Create a new problem     |
| PUT    | `/problems/:id`   | ProblemsController.updateProblem| Update a problem         |
| DELETE | `/problems/:id`   | ProblemsController.deleteProblem| Delete a problem         |

### Test Cases

| Method | Path                            | Handler                                    | Description                |
|--------|---------------------------------|--------------------------------------------|----------------------------|
| GET    | `/problems/:id/test-cases`      | TestCasesController.getTestCasesByProblemId | List test cases for problem|
| POST   | `/problems/:id/test-cases`      | TestCasesController.addTestCaseToProblem    | Add a single test case     |
| POST   | `/problems/:id/test-cases/bulk` | TestCasesController.bulkAddTestCasesToProblem| Add multiple test cases   |

### Starter Codes

| Method | Path                               | Handler                                          | Description                  |
|--------|------------------------------------|-------------------------------------------------|------------------------------|
| GET    | `/problems/:id/starter-codes`      | StarterCodesController.getStarterCodesByProblemId| List starter codes           |
| POST   | `/problems/:id/starter-codes`      | StarterCodesController.addStarterCodeToProblem   | Add a single starter code    |
| POST   | `/problems/:id/starter-codes/bulk` | StarterCodesController.bulkAddStarterCodesToProblem| Add multiple starter codes |

---

## Auth (planned)

Not yet implemented. See [Technical Decisions](technical-decisions.md#11-auth-strategy-planned--in-progress) for the planned approach (JWT + refresh token rotation + OTP email verification).
