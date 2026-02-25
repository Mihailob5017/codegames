# CodeGames — Database Schema Design

> Solo learning project. Full scope intentionally large. Build iteratively.

---

## Feature Inventory

| Domain         | Feature                                                                             |
| -------------- | ----------------------------------------------------------------------------------- |
| Auth           | JWT access tokens, refresh token rotation, OTP email verification, Google OAuth     |
| User           | Profile (bio, avatar, country, socials), preferences, stats cache                   |
| Problem        | Description, constraints, hints, images, tags, company tags, difficulty             |
| Code           | Per-language starter code, official solutions (code + explanation + complexity)     |
| Test Cases     | Sample (visible) vs hidden (submit-only), per-case time/memory limits               |
| Submission     | Multi-language, status tracking, contest context                                    |
| User × Problem | Solved/attempted/bookmarked state, like/dislike, saved code draft, private notes    |
| Discussion     | Threaded posts on problems, upvote/downvote, tagging, mod tools                     |
| Leaderboard    | Global + weekly + monthly snapshots, contest rankings                               |
| Gamification   | Achievements/badges, daily challenge, streak tracking                               |
| Contests       | Timed competitions with ranked problems and point scoring                           |
| Practice Tests | User-created timed tests: 1–5 problems, custom time limit, per-problem hint control |
| Notifications  | In-app: achievements, replies, contest alerts                                       |
| Admin          | Problem publishing workflow, mod tools for discussion                               |

### Suggested Additions (worth building)

- **Study Plans** — curated, ordered sequences of problems (e.g. "Blind 75", "Two Pointers Mastery")
- **Code Runs** — lightweight `Run` (not Submit) executions against sample cases only, stored separately from full submissions so the submission history stays clean
- **Follow System** — follow other users to see activity feed / leaderboard subset
- **Problem Reports** — users flag incorrect problems/test cases for admin review
- **Saved Code Drafts per language** — separate table so users don't lose work when switching languages
- **Editorial** — long-form written approach explanation (distinct from the solution code)

---

## Entity Relationship Overview

```
User ──< Submission >── Problem ──< TestCase
 │                        │
 │                        ├──< StarterCode (per language)
 │                        ├──< ProblemSolution (per language)
 │                        ├──< ProblemImage
 │                        ├──< ProblemTag >── Tag
 │                        ├──< ProblemCompany >── Company
 │                        └──< DailyChallenge
 │
 ├──< RefreshToken
 ├──< UserProblemStatus >── Problem
 ├──< SavedCode >── Problem
 ├──< ProblemNote >── Problem
 ├──< UserAchievement >── Achievement
 ├──< ContestParticipant >── Contest ──< ContestProblem >── Problem
 ├──< PracticeTest ──< PracticeTestProblem >── Problem
 │       └──< PracticeTestSession
 ├──< DiscussionPost >── Problem
 │       └──< DiscussionComment (self-ref for threads)
 │                 └──< DiscussionVote
 ├──< Notification
 └──< LeaderboardSnapshot
```

---

## Full Prisma Schema

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "darwin-arm64", "linux-musl-arm64-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ================================================================
// ENUMS
// ================================================================

enum Role {
  user
  admin
  moderator // can pin/lock threads, delete discussion content
}

enum Difficulty {
  easy
  medium
  hard
}

enum Language {
  javascript
  typescript
  python
  java
  cpp
  go
  rust
  csharp
}

enum SubmissionStatus {
  pending
  accepted
  wrong_answer
  time_limit_exceeded
  memory_limit_exceeded
  runtime_error
  compile_error
}

enum ContestStatus {
  upcoming
  active
  ended
}

enum PracticeTestStatus {
  not_started
  in_progress
  completed
  timed_out
}

// ================================================================
// USER & AUTH
// ================================================================

model User {
  id       String @id @default(cuid())
  username String @unique @db.VarChar(20)
  email    String @unique @db.VarChar(100)

  // --- Auth ---
  passwordHash      String?
  googleId          String?   @unique
  isGoogleLogin     Boolean   @default(false)
  verifyToken       Int?
  verifyTokenExpiry DateTime?
  verified          Boolean   @default(false)
  role              Role      @default(user)

  // --- Profile ---
  firstName  String
  lastName   String
  bio        String?  @db.VarChar(500)
  avatarUrl  String?  // URL to stored image (S3 / Cloudinary)
  country    String?  @db.VarChar(100)
  githubUrl  String?  @db.VarChar(200)
  twitterUrl String?  @db.VarChar(200)
  websiteUrl String?  @db.VarChar(200)

  // --- Preferences ---
  defaultLanguage Language @default(javascript)

  // --- Stats cache (derived but denormalised for perf) ---
  totalSolved   Int       @default(0)
  easySolved    Int       @default(0)
  mediumSolved  Int       @default(0)
  hardSolved    Int       @default(0)
  currentStreak Int       @default(0)
  longestStreak Int       @default(0)
  lastActiveAt  DateTime?

  // --- Relations ---
  submissions           Submission[]
  refreshTokens         RefreshToken[]
  userProblemStatuses   UserProblemStatus[]
  savedCodes            SavedCode[]
  problemNotes          ProblemNote[]
  discussionPosts       DiscussionPost[]
  discussionComments    DiscussionComment[]
  votes                 DiscussionVote[]
  achievements          UserAchievement[]
  contestParticipations ContestParticipant[]
  practiceTests         PracticeTest[]
  practiceTestSessions  PracticeTestSession[]
  notifications         Notification[]
  leaderboardSnapshots  LeaderboardSnapshot[]
  codeRuns              CodeRun[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
  @@index([username])
  @@index([email])
}

model RefreshToken {
  id         String   @id @default(cuid())
  userId     String
  token      String   @unique @db.Text
  expiresAt  DateTime
  isRevoked  Boolean  @default(false)
  replacedBy String?
  userAgent  String?  @db.VarChar(500)
  ipAddress  String?  @db.VarChar(50)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("refresh_tokens")
  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@index([isRevoked])
}

// ================================================================
// PROBLEM
// ================================================================

model Problem {
  id     String @id @default(cuid())
  number Int    @unique // e.g. #1, #42 — the canonical problem number
  title  String @db.VarChar(200)
  slug   String @unique @db.VarChar(250) // url-safe title for routing

  // --- Content ---
  description String  @db.Text
  constraints String? @db.Text // e.g. "1 <= n <= 10^5, 1 <= k <= n"
  explanation String? @db.Text // high-level editorial hint (not a full solution)
  hints       String[]         // ordered list of progressive hints

  // --- Classification ---
  difficulty  Difficulty
  isPublished Boolean    @default(false) // unpublished = only admins can see

  // --- Cached aggregates ---
  totalSubmissions Int    @default(0)
  totalAccepted    Int    @default(0)
  acceptanceRate   Float? // recomputed by a cron / trigger

  // --- Relations ---
  tags            ProblemTag[]
  companies       ProblemCompany[]
  starterCodes    StarterCode[]
  solutions       ProblemSolution[]
  images          ProblemImage[]
  testCases       TestCase[]
  submissions     Submission[]
  codeRuns        CodeRun[]
  userStatuses    UserProblemStatus[]
  savedCodes      SavedCode[]
  problemNotes    ProblemNote[]
  discussionPosts DiscussionPost[]
  contestProblems     ContestProblem[]
  practiceTestProblems PracticeTestProblem[]
  dailyChallenges     DailyChallenge[]
  studyPlanItems      StudyPlanItem[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("problems")
  @@index([difficulty])
  @@index([number])
  @@index([slug])
  @@index([isPublished])
}

// --- Tags (replaces the ProblemType enum — far more flexible) ---

model Tag {
  id   String @id @default(cuid())
  name String @unique @db.VarChar(50) // "Array", "Dynamic Programming", etc.
  slug String @unique @db.VarChar(60)

  problems      ProblemTag[]
  discussionTags DiscussionPostTag[]

  @@map("tags")
}

model ProblemTag {
  problemId String
  tagId     String

  problem Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)
  tag     Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([problemId, tagId])
  @@map("problem_tags")
}




// --- Official solutions (per language) ---

model ProblemSolution {
  id              String   @id @default(cuid())
  problemId       String
  language        Language
  code            String   @db.Text
  approach        String?  @db.Text   // written explanation of the approach
  timeComplexity  String?  @db.VarChar(50)  // "O(n log n)"
  spaceComplexity String?  @db.VarChar(50)  // "O(n)"

  problem Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)

  @@unique([problemId, language])
  @@map("problem_solutions")
}



// ================================================================
// SUBMISSION & CODE RUN
// ================================================================

// Full submission — runs all test cases, saved permanently
model Submission {
  id             String           @id @default(cuid())
  userId         String
  problemId      String
  code           String           @db.Text
  language       Language
  status         SubmissionStatus @default(pending)
  executionTime  Int?             // ms
  memoryUsed     Int?             // MB
  testCasesPassed Int             @default(0)
  totalTestCases  Int             @default(0)
  errorMessage   String?          @db.Text

  // If inside a contest
  contestId String?

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  problem Problem  @relation(fields: [problemId], references: [id], onDelete: Cascade)
  contest Contest? @relation(fields: [contestId], references: [id])

  submittedAt DateTime @default(now())

  @@map("submissions")
  @@index([userId])
  @@index([problemId])
  @@index([status])
  @@index([contestId])
  @@index([submittedAt])
}

// Code run — "Run" button, sample cases only, ephemeral/not scored
model CodeRun {
  id            String           @id @default(cuid())
  userId        String
  problemId     String
  code          String           @db.Text
  language      Language
  status        SubmissionStatus @default(pending)
  executionTime Int?
  memoryUsed    Int?
  output        Json?            // actual output per sample case
  errorMessage  String?          @db.Text

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  problem Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)

  ranAt DateTime @default(now())

  @@map("code_runs")
  @@index([userId, problemId])
  @@index([ranAt])
}

// ================================================================
// USER × PROBLEM RELATIONSHIP
// ================================================================

// Tracks solved/attempted/bookmarked state per user per problem
model UserProblemStatus {
  userId       String
  problemId    String
  isSolved     Boolean   @default(false)
  isAttempted  Boolean   @default(false)
  isBookmarked Boolean   @default(false)
  vote         Int?      // +1 = like, -1 = dislike, null = no vote
  solvedAt     DateTime?

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  problem Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)

  @@id([userId, problemId])
  @@map("user_problem_status")
  @@index([userId])
  @@index([userId, isSolved])
  @@index([userId, isBookmarked])
}

// Saved code drafts per user/problem/language (not a submission)
model SavedCode {
  id        String   @id @default(cuid())
  userId    String
  problemId String
  language  Language
  code      String   @db.Text

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  problem Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)

  updatedAt DateTime @updatedAt

  @@unique([userId, problemId, language])
  @@map("saved_codes")
  @@index([userId, problemId])
}

// Private scratchpad notes on a problem
model ProblemNote {
  id        String  @id @default(cuid())
  userId    String
  problemId String
  content   String  @db.Text // markdown

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  problem Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)

  updatedAt DateTime @updatedAt

  @@unique([userId, problemId])
  @@map("problem_notes")
}

// ================================================================
// DISCUSSION
// ================================================================

model DiscussionPost {
  id        String  @id @default(cuid())
  problemId String? // null = general / off-topic
  userId    String
  title     String  @db.VarChar(200)
  body      String  @db.Text // markdown

  // Mod controls
  isPinned Boolean @default(false)
  isLocked Boolean @default(false)

  // Denormalised vote counts (update via application logic)
  upvotes   Int @default(0)
  downvotes Int @default(0)

  tags     DiscussionPostTag[]
  comments DiscussionComment[]
  votes    DiscussionVote[]

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  problem Problem? @relation(fields: [problemId], references: [id], onDelete: SetNull)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("discussion_posts")
  @@index([problemId])
  @@index([userId])
  @@index([isPinned])
  @@index([createdAt])
}

// Supports nested threading one level deep (comment → replies)
model DiscussionComment {
  id       String  @id @default(cuid())
  postId   String
  userId   String
  parentId String? // null = top-level comment; non-null = reply
  body     String  @db.Text // markdown

  upvotes   Int @default(0)
  downvotes Int @default(0)

  parent  DiscussionComment?  @relation("CommentThread", fields: [parentId], references: [id])
  replies DiscussionComment[] @relation("CommentThread")

  user  User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  post  DiscussionPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  votes DiscussionVote[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("discussion_comments")
  @@index([postId])
  @@index([userId])
  @@index([parentId])
}

// One vote row per user per post OR per comment
model DiscussionVote {
  id        String @id @default(cuid())
  userId    String
  postId    String?
  commentId String?
  value     Int    // +1 or -1

  user    User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  post    DiscussionPost?    @relation(fields: [postId], references: [id], onDelete: Cascade)
  comment DiscussionComment? @relation(fields: [commentId], references: [id], onDelete: Cascade)

  // A user can only vote once per post OR once per comment
  @@unique([userId, postId])
  @@unique([userId, commentId])
  @@map("discussion_votes")
  @@index([postId])
  @@index([commentId])
}

model DiscussionPostTag {
  postId String
  tagId  String // reuses the same Tag table as problems

  post DiscussionPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag  Tag            @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId])
  @@map("discussion_post_tags")
}

// ================================================================
// LEADERBOARD
// ================================================================

// Periodic snapshots (computed by a cron job or background worker).
// Avoids expensive live aggregations on every leaderboard page load.
// period examples: "global", "2025-02" (monthly), "2025-W08" (weekly)
model LeaderboardSnapshot {
  id     String @id @default(cuid())
  userId String
  period String @db.VarChar(20)
  rank   Int
  score  Int    // weighted: hard=5, medium=3, easy=1 (or custom)
  solved Int

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  snapshotAt DateTime @default(now())

  @@unique([userId, period])
  @@map("leaderboard_snapshots")
  @@index([period, rank])
}

// ================================================================
// GAMIFICATION
// ================================================================

model Achievement {
  id          String @id @default(cuid())
  name        String @unique @db.VarChar(100)
  description String @db.VarChar(500)
  iconUrl     String?
  // Flexible criteria: { "type": "solved_count", "difficulty": "hard", "threshold": 50 }
  criteria    Json

  users UserAchievement[]

  @@map("achievements")
}

model UserAchievement {
  userId        String
  achievementId String
  awardedAt     DateTime @default(now())

  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievement Achievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)

  @@id([userId, achievementId])
  @@map("user_achievements")
}

model DailyChallenge {
  id        String   @id @default(cuid())
  problemId String
  date      DateTime @unique // one problem per calendar day

  problem Problem @relation(fields: [problemId], references: [id])

  @@map("daily_challenges")
  @@index([date])
}

// ================================================================
// CONTESTS
// ================================================================

model Contest {
  id          String        @id @default(cuid())
  title       String        @db.VarChar(200)
  description String?       @db.Text
  status      ContestStatus @default(upcoming)
  startTime   DateTime
  endTime     DateTime
  isPublic    Boolean       @default(true)

  problems     ContestProblem[]
  participants ContestParticipant[]
  submissions  Submission[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("contests")
  @@index([status])
  @@index([startTime])
}

model ContestProblem {
  contestId String
  problemId String
  order     Int // display order within the contest
  points    Int @default(100)

  contest Contest @relation(fields: [contestId], references: [id], onDelete: Cascade)
  problem Problem @relation(fields: [problemId], references: [id], onDelete: Cascade)

  @@id([contestId, problemId])
  @@map("contest_problems")
}

model ContestParticipant {
  contestId String
  userId    String
  score     Int      @default(0)
  rank      Int?
  joinedAt  DateTime @default(now())

  contest Contest @relation(fields: [contestId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([contestId, userId])
  @@map("contest_participants")
  @@index([contestId, score])
}

// ================================================================
// STUDY PLANS
// ================================================================

model StudyPlan {
  id          String  @id @default(cuid())
  title       String  @db.VarChar(200)
  description String? @db.Text
  isOfficial  Boolean @default(false) // admin-curated vs user-created
  creatorId   String? // null = system plan

  items StudyPlanItem[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("study_plans")
}

model StudyPlanItem {
  id          String  @id @default(cuid())
  studyPlanId String
  problemId   String
  order       Int
  notes       String? @db.VarChar(500) // e.g. "focus on the sliding window pattern"

  studyPlan StudyPlan @relation(fields: [studyPlanId], references: [id], onDelete: Cascade)
  problem   Problem   @relation(fields: [problemId], references: [id], onDelete: Cascade)

  @@unique([studyPlanId, problemId])
  @@map("study_plan_items")
  @@index([studyPlanId, order])
}

// ================================================================
// PRACTICE TESTS
// ================================================================

// A user-configured timed test: pick 1–5 problems, set a time limit,
// and optionally hide specific hints per problem.
model PracticeTest {
  id               String @id @default(cuid())
  userId           String
  title            String? @db.VarChar(200)
  timeLimitSeconds Int     // e.g. 1800 = 30 min; enforced client-side and recorded server-side

  user     User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  problems PracticeTestProblem[]
  sessions PracticeTestSession[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("practice_tests")
  @@index([userId])
}

// Which problems are in the test and which hints are suppressed for each.
model PracticeTestProblem {
  testId              String
  problemId           String
  order               Int    // display order (1–5)
  disabledHintIndices Int[]  // 0-based indices into Problem.hints to hide

  test    PracticeTest @relation(fields: [testId], references: [id], onDelete: Cascade)
  problem Problem      @relation(fields: [problemId], references: [id], onDelete: Cascade)

  @@id([testId, problemId])
  @@map("practice_test_problems")
  @@index([testId, order])
}

// One session per user run of a practice test.
model PracticeTestSession {
  id        String             @id @default(cuid())
  testId    String
  userId    String
  status    PracticeTestStatus @default(not_started)
  startedAt DateTime?
  endedAt   DateTime?          // null until completed or timed out
  score     Int                @default(0) // count of problems solved within the time limit

  test PracticeTest @relation(fields: [testId], references: [id], onDelete: Cascade)
  user User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@map("practice_test_sessions")
  @@index([testId])
  @@index([userId])
}

// ================================================================
// NOTIFICATIONS
// ================================================================

// type examples: "achievement_awarded", "discussion_reply",
//                "contest_starting", "daily_challenge_reminder"
model Notification {
  id      String  @id @default(cuid())
  userId  String
  type    String  @db.VarChar(50)
  title   String  @db.VarChar(200)
  body    String? @db.VarChar(500)
  link    String? @db.VarChar(500) // deep-link route (e.g. /problems/two-sum/discuss/abc)
  isRead  Boolean @default(false)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@map("notifications")
  @@index([userId, isRead])
  @@index([userId, createdAt])
}
```

---

## Design Decisions

### Tags over enum for problem categories

The existing `ProblemType` enum is replaced by a many-to-many `Tag` table. This lets a problem belong to multiple categories ("Array" + "Sliding Window" + "Two Pointers") and lets admins add new tags without a schema migration.

### Denormalised counters

`User.totalSolved`, `Problem.acceptanceRate`, `DiscussionPost.upvotes` etc. are cached values. They are fast to read (no join) but must be kept in sync by the application when the underlying data changes. An alternative is a Postgres `MATERIALIZED VIEW` or a cron recalculation job — either works.

### SavedCode separate from Submission

LeetCode autosaves your draft as you type. That draft is not a submission. Keeping them separate means the submissions table stays clean and the saved draft can be updated silently on every keystroke debounce.

### CodeRun separate from Submission

"Run" (sample cases only) vs "Submit" (all cases, scored) are meaningfully different operations. Mixing them pollutes the submission history and inflates `totalSubmissions` counts.

### Leaderboard as snapshots

Recomputing ranks over all users in real time is expensive. A background job (cron) materialises snapshots into `LeaderboardSnapshot` on a schedule (e.g. every hour for weekly/monthly, every day for global). The live leaderboard page reads from this table.

### Polymorphic vote table

`DiscussionVote` covers votes on both posts and comments in one table. The unique constraints on `(userId, postId)` and `(userId, commentId)` enforce the one-vote-per-target rule. An alternative is two separate vote tables — simpler foreign keys, slightly less flexible.

### Discussion threading depth

One level of threading (comment → replies). Unlimited depth threading (Reddit-style) is more complex to render and query. One level covers 95% of real discussion patterns and is easier to paginate.

### Contests link to Submissions

A `Submission` carries an optional `contestId`. This means the same submission table covers both practice and contest modes. Contest rankings are computed from submissions where `contestId` matches and `submittedAt` is within the contest window.

---

## What's NOT here (intentionally)

| Omitted                             | Why                                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| User follow/friend graph            | Nice-to-have, adds complexity. Add later.                                                      |
| Problem report/flag                 | Useful admin tool, low priority for MVP.                                                       |
| Real-time notifications (WebSocket) | Design as polling first; add WS later if needed.                                               |
| Image upload/storage logic          | Schema just stores a URL — the upload pipeline (S3, Cloudinary) is infrastructure, not schema. |
| Payments / premium tiers            | Out of scope — all problems are free.                                                          |
| Activity feed                       | Derivable from existing events; add a view or event table later.                               |

---

## Build Order Suggestion

```
Phase 1 — Core
  User CRUD + Auth (JWT, refresh tokens, OTP, Google OAuth)
  Problem CRUD (admin only for now)
  Tags + StarterCode + TestCases

Phase 2 — Execution
  Submission + CodeRun (Judge0 integration)
  UserProblemStatus (solved/attempted tracking)
  SavedCode (autosave draft)

Phase 3 — Discovery
  Search + filter by tag/difficulty/company
  DailyChallenge
  Study Plans
  Practice Tests (timed, 1–5 problems, hint control)

Phase 4 — Social
  Discussion (posts, comments, votes)
  Notifications
  User profile page (public)

Phase 5 — Competitive
  Leaderboard snapshots
  Achievements
  Contests

Phase 6 — Polish
  Problem reports
  Follow system
  Activity feed
```
