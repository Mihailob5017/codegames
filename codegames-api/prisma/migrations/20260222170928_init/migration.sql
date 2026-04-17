-- CreateEnum
CREATE TYPE "problem_difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('PYTHON', 'JAVASCRIPT', 'JAVA', 'CSHARP', 'CPP');

-- CreateEnum
CREATE TYPE "problem_category" AS ENUM ('ARRAYS', 'STRINGS', 'HASHMAPS', 'TWO_POINTERS', 'STACKS', 'BINARY_SEARCH', 'SLIDING_WINDOW', 'LINKED_LISTS', 'TREES', 'TRIES', 'BACKTRACKING', 'HEAPS', 'GRAPHS', 'DYNAMIC_PROGRAMMING', 'INTERVALS', 'GREEDY', 'MATH', 'MISC');

-- CreateEnum
CREATE TYPE "submission_status" AS ENUM ('ACCEPTED', 'PENDING', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'RUNTIME_ERROR', 'COMPILE_ERROR');

-- CreateEnum
CREATE TYPE "problem_status" AS ENUM ('SOLVED', 'ATTEMPTED', 'UNSOLVED');

-- CreateTable
CREATE TABLE "problems" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "examples" TEXT[],
    "constrains" TEXT NOT NULL,
    "hints" TEXT[],
    "difficulty" "problem_difficulty" NOT NULL,
    "categories" "problem_category"[],
    "solution" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "totalSubmissions" INTEGER NOT NULL DEFAULT 0,
    "acceptedSubmissions" INTEGER NOT NULL DEFAULT 0,
    "acceptanceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "logoUrl" TEXT,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problem_companies" (
    "problemId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "problem_companies_pkey" PRIMARY KEY ("problemId","companyId")
);

-- CreateTable
CREATE TABLE "starter_codes" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "starter_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problem_solutions" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "code" TEXT NOT NULL,
    "approach" TEXT NOT NULL,
    "time_complexity" VARCHAR(100) NOT NULL,
    "space_complexity" VARCHAR(100) NOT NULL,

    CONSTRAINT "problem_solutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problem_images" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "altText" VARCHAR(200),
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "problem_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_cases" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "isSample" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "problems_number_key" ON "problems"("number");

-- CreateIndex
CREATE UNIQUE INDEX "problems_slug_key" ON "problems"("slug");

-- CreateIndex
CREATE INDEX "problems_number_idx" ON "problems"("number");

-- CreateIndex
CREATE INDEX "problems_slug_idx" ON "problems"("slug");

-- CreateIndex
CREATE INDEX "problems_difficulty_idx" ON "problems"("difficulty");

-- CreateIndex
CREATE INDEX "problems_categories_idx" ON "problems"("categories");

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "starter_codes_problemId_language_key" ON "starter_codes"("problemId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "problem_solutions_problemId_language_key" ON "problem_solutions"("problemId", "language");

-- CreateIndex
CREATE INDEX "problem_images_problemId_idx" ON "problem_images"("problemId");

-- AddForeignKey
ALTER TABLE "problem_companies" ADD CONSTRAINT "problem_companies_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_companies" ADD CONSTRAINT "problem_companies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "starter_codes" ADD CONSTRAINT "starter_codes_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_solutions" ADD CONSTRAINT "problem_solutions_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_images" ADD CONSTRAINT "problem_images_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
