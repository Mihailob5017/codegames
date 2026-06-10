# CodeGames — Database Schema Design

> Solo learning project. Full scope intentionally large. Build iteratively per the [roadmap](roadmap.md).

---

## Feature Inventory by Phase

### Phase 1 — MVP (1.0)

| Domain         | Feature                                                                           |
| -------------- | --------------------------------------------------------------------------------- |
| Auth           | JWT access tokens, refresh token rotation, OTP email verification, Google OAuth   |
| User           | Profile (name, avatar, country), preferences (language, theme), activity heatmap  |
| Problem        | Description, constraints, hints, examples, images, difficulty, category, companies |
| Code           | Per-language starter code, per-language solutions (code + explanation + complexity) |
| Test Cases     | Sample (visible) vs hidden (submit-only)                                          |
| Code Execution | Run (fail-fast on first test → expected/actual, then full results) and Submit     |
| Submission     | Multi-language, status tracking, per-user solved/attempted state                  |
| Leaderboard    | Global ranking by weighted score, streak tracking                                 |
| Daily          | Problem of the day                                                                |
| Drawing        | tldraw-style whiteboard per problem (client-side only, no schema needed)          |
| Admin          | Separate dashboard, CRUD users/problems/test cases, analytics                     |

### Phase 2 — Super User (2.0)

| Domain         | Feature                                                                           |
| -------------- | --------------------------------------------------------------------------------- |
| Subscription   | Paid monthly tier (super_user role)                                               |
| Practice Tests | Create timed tests: pick problems, set time limit, choose algo/category           |
| Test Analytics | Attempts, failures, code typed, per-problem breakdown                             |
| Visibility     | Limit hints/solutions visibility within a test                                    |

### Future Scope

| Domain         | Feature                                                                           |
| -------------- | --------------------------------------------------------------------------------- |
| Learning Plans | Curated, ordered sequences of problems                                            |
| Quiz Mode      | Non-coding theory questions (Big-O, data structures, system design)               |
| Custom Problems| Super users author their own problems                                             |
| Likes          | Upvote/downvote problems                                                          |
| Pair Coding    | Real-time collaborative solving (WebSocket)                                       |
| Competitions   | Head-to-head or group speed races                                                 |
| Discussion     | Threaded posts on problems, voting, mod tools                                     |

---

## Entity Relationship Overview

### Current (implemented)

```
Problem ──< TestCase
  ├──< StarterCode (per language)
  ├──< ProblemSolution (per language)
  ├──< ProblemImage
  └──< ProblemCompany >── Company

User (has role: USER | SUPER_USER | ADMIN)
```

### Phase 1 (planned additions)

```
User ──< Submission >── Problem
  │
  ├──< RefreshToken
  ├──< UserProblemStatus >── Problem  (solved/attempted/bookmarked)
  └──< LeaderboardSnapshot

Problem ──< DailyChallenge
```

### Phase 2 (planned additions)

```
User ──< PracticeTest ──< PracticeTestProblem >── Problem
                └──< PracticeTestSession
```

---

## Current Prisma Schema (what's actually in the DB)

```prisma
// ================================================================
// ENUMS
// ================================================================

enum problem_difficulty {
  EASY
  MEDIUM
  HARD
}

enum Language {
  PYTHON
  JAVASCRIPT
  JAVA
  CSHARP
  CPP
}

enum Role {
  USER
  SUPER_USER
  ADMIN
}

enum problem_category {
  ARRAYS
  STRINGS
  HASHMAPS
  TWO_POINTERS
  STACKS
  BINARY_SEARCH
  SLIDING_WINDOW
  LINKED_LISTS
  TREES
  TRIES
  BACKTRACKING
  HEAPS
  GRAPHS
  DYNAMIC_PROGRAMMING
  INTERVALS
  GREEDY
  MATH
  MISC
}

enum submission_status {
  ACCEPTED
  PENDING
  WRONG_ANSWER
  TIME_LIMIT_EXCEEDED
  MEMORY_LIMIT_EXCEEDED
  RUNTIME_ERROR
  COMPILE_ERROR
}

enum problem_status {
  SOLVED
  ATTEMPTED
  UNSOLVED
}

// ================================================================
// PROBLEM
// ================================================================

model Problem {
  id          String             @id @default(cuid())
  number      Int                @unique @default(autoincrement())
  title       String             @db.VarChar(200)
  slug        String             @unique @db.VarChar(200)
  description String             @db.Text
  examples    String[]           @db.Text
  constrains  String             @db.Text
  hints       String[]           @db.Text
  difficulty  problem_difficulty
  categories  problem_category[]
  solution    String             @db.Text
  explanation String             @db.Text
  isPublished Boolean            @default(false)

  Companies        ProblemCompany[]
  StarterCodes     StarterCode[]
  ProblemSolutions ProblemSolution[]
  ProblemImages    ProblemImage[]
  TestCases        TestCase[]

  totalSubmissions    Int   @default(0)
  acceptedSubmissions Int   @default(0)
  acceptanceRate      Float @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("problems")
  @@index([number])
  @@index([slug])
  @@index([difficulty])
  @@index([categories])
}

model Company {
  id      String  @id @default(cuid())
  name    String  @unique @db.VarChar(100)
  logoUrl String?

  problems ProblemCompany[]

  @@map("companies")
}

model ProblemCompany {
  problemId String
  companyId String
  frequency Int    @default(1)

  problem Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)
  company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@id([problemId, companyId])
  @@map("problem_companies")
}

model StarterCode {
  id        String   @id @default(cuid())
  problemId String
  language  Language
  code      String   @db.Text

  problem Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)

  @@unique([problemId, language])
  @@map("starter_codes")
}

model ProblemSolution {
  id               String   @id @default(cuid())
  problemId        String
  language         Language
  code             String   @db.Text
  approach         String   @db.Text
  time_complexity  String   @db.VarChar(100)
  space_complexity String   @db.VarChar(100)

  problem Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)

  @@unique([problemId, language])
  @@map("problem_solutions")
}

model ProblemImage {
  id        String  @id @default(cuid())
  problemId String
  url       String  @db.VarChar(500)
  altText   String? @db.VarChar(200)
  order     Int     @default(0)

  problem Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)

  @@map("problem_images")
  @@index([problemId])
}

model TestCase {
  id             String  @id @default(cuid())
  problemId      String
  input          String  @db.Text
  expectedOutput String  @db.Text
  isSample       Boolean @default(false)

  problem Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)

  @@map("test_cases")
  @@index([problemId])
}

// ================================================================
// USER
// ================================================================

model User {
  id                String    @id @default(cuid())
  username          String    @unique @db.VarChar(50)
  email             String    @unique @db.VarChar(100)
  passwordHash      String    @db.VarChar(200)
  firstName         String?   @db.VarChar(100)
  lastName          String?   @db.VarChar(100)
  profilePictureUrl String?   @db.VarChar(500)
  googleId          String?   @unique @db.VarChar(100)
  isGoogleLogin     Boolean   @default(false)
  isVerified        Boolean   @default(false)
  verifyToken       Int?
  verifyTokenExpiry DateTime?
  role              Role      @default(USER)
  country           String?   @db.VarChar(100)

  totalSolved   Int       @default(0)
  currentStreak Int       @default(0)
  longestStreak Int       @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
  @@index([username])
  @@index([email])
}
```

---

## Models to Add (Phase 1)

These models will be added as Phase 1 features are built.

### RefreshToken

```prisma
model RefreshToken {
  id         String   @id @default(cuid())
  userId     String
  token      String   @unique @db.Text
  expiresAt  DateTime
  isRevoked  Boolean  @default(false)
  replacedBy String?  // points to the token that replaced this one (rotation chain)
  userAgent  String?  @db.VarChar(500)
  ipAddress  String?  @db.VarChar(50)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@map("refresh_tokens")
  @@index([userId])
  @@index([token])
  @@index([expiresAt])
}
```

### Submission

```prisma
model Submission {
  id              String            @id @default(cuid())
  userId          String
  problemId       String
  code            String            @db.Text
  language        Language
  status          submission_status @default(PENDING)
  executionTime   Int?              // ms
  memoryUsed      Int?              // MB
  testCasesPassed Int               @default(0)
  totalTestCases  Int               @default(0)
  errorMessage    String?           @db.Text

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  problem Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)

  submittedAt DateTime @default(now())

  @@map("submissions")
  @@index([userId])
  @@index([problemId])
  @@index([status])
  @@index([submittedAt])
}
```

### UserProblemStatus

```prisma
model UserProblemStatus {
  userId      String
  problemId   String
  status      problem_status @default(UNSOLVED)
  solvedAt    DateTime?

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  problem Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)

  @@id([userId, problemId])
  @@map("user_problem_status")
  @@index([userId])
  @@index([userId, status])
}
```

### LeaderboardSnapshot

```prisma
model LeaderboardSnapshot {
  id     String @id @default(cuid())
  userId String
  period String @db.VarChar(20) // "global", "2026-02" (monthly), "2026-W09" (weekly)
  rank   Int
  score  Int    // weighted: hard=5, medium=3, easy=1
  solved Int

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  snapshotAt DateTime @default(now())

  @@unique([userId, period])
  @@map("leaderboard_snapshots")
  @@index([period, rank])
}
```

### DailyChallenge

```prisma
model DailyChallenge {
  id        String   @id @default(cuid())
  problemId String
  date      DateTime @unique // one problem per calendar day

  problem Problem @relation(fields: [problemId], references: [id])

  @@map("daily_challenges")
  @@index([date])
}
```

---

## Models to Add (Phase 2 — Super User)

### PracticeTest

```prisma
model PracticeTest {
  id               String  @id @default(cuid())
  userId           String
  title            String? @db.VarChar(200)
  timeLimitSeconds Int     // e.g. 1800 = 30 min

  user     User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  problems PracticeTestProblem[]
  sessions PracticeTestSession[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("practice_tests")
  @@index([userId])
}

model PracticeTestProblem {
  testId              String
  problemId           String
  order               Int    // display order
  disabledHintIndices Int[]  // 0-based indices into Problem.hints to hide
  solutionVisible     Boolean @default(true) // can hide solution for this problem in the test

  test    PracticeTest @relation(fields: [testId], references: [id], onDelete: Cascade)
  problem Problem      @relation(fields: [problemId], references: [id], onDelete: Cascade)

  @@id([testId, problemId])
  @@map("practice_test_problems")
  @@index([testId, order])
}

model PracticeTestSession {
  id        String   @id @default(cuid())
  testId    String
  userId    String
  status    String   @db.VarChar(20) // not_started, in_progress, completed, timed_out
  startedAt DateTime?
  endedAt   DateTime?
  score     Int      @default(0)

  test PracticeTest @relation(fields: [testId], references: [id], onDelete: Cascade)
  user User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@map("practice_test_sessions")
  @@index([testId])
  @@index([userId])
}
```

---

## Design Decisions

### `problem_category` enum (vs. Tags table)

Currently using a PostgreSQL enum array (`problem_category[]`) on the `Problem` table. Fast to query and validated at the DB level. The trade-off is that adding a new category requires a migration. If the category list grows frequently, consider switching to a many-to-many `Tag` table — but for now the enum is simpler and good enough.

### JSON string test case format

`input` and `expectedOutput` are stored as JSON strings. Problems have different argument shapes (`(nums, target)` vs `(matrix, k)`), so a fixed column schema doesn't work. The wrapper service parses them at execution time.

### Denormalized counters

`User.totalSolved`, `Problem.acceptanceRate`, etc. are cached values updated by application logic when underlying data changes. Fast to read (no join), but must be kept in sync.

### Three-tier role system

`USER` → free, tracked submissions. `SUPER_USER` → paid tier with test creation and analytics. `ADMIN` → full control, separate dashboard.

### Leaderboard as snapshots

Recomputing ranks over all users in real time is expensive. A background job materializes snapshots into `LeaderboardSnapshot` on a schedule. The leaderboard page reads from this table.

---

## What's NOT Here (intentionally)

| Omitted                             | Why                                                                                |
| ----------------------------------- | ---------------------------------------------------------------------------------- |
| User follow/friend graph            | Future scope. Adds complexity with no current benefit.                             |
| Real-time notifications (WebSocket) | Design as polling first; add WS later if needed.                                   |
| Image upload/storage logic          | Schema just stores a URL — upload pipeline (S3, Cloudinary) is infrastructure.     |
| Discussion / comments               | Future scope. Build after core loop is solid.                                      |
| Payments / billing tables            | Payment handled by Stripe/external — no need to model it in the app DB for now.   |
| Activity feed                        | Derivable from existing events; add a view or event table later.                  |
