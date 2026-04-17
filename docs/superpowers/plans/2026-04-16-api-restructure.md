# API Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `codegames-api/` into a clean vertical-slice layout with a `shared/` layer, extract `auth/` as its own module, fix 10 code quality issues, and add Prisma DX scripts.

**Architecture:** Feature modules live at the root of `codegames-api/` (no `src/` wrapper). Cross-cutting concerns (`errors`, `types`, `test-utils`) move into `shared/`. Each module owns its controller, service, repository, dto, route, and tests.

**Tech Stack:** Node 24, Express 5, TypeScript 5, Prisma 7, Zod 4, Jest 30, bcryptjs, Winston

**Spec:** `docs/superpowers/specs/2026-04-16-api-restructure-design.md`

---

### Task 1: Create `shared/` layer and update all imports

**Files:**
- Create: `codegames-api/shared/errors/app-error.ts`
- Create: `codegames-api/shared/errors/app-error.test.ts`
- Create: `codegames-api/shared/types/common.types.ts`
- Create: `codegames-api/shared/test-utils/test-helpers.ts`
- Delete: `codegames-api/errors/` (entire folder)
- Delete: `codegames-api/types/` (entire folder)
- Delete: `codegames-api/__tests__/` (entire folder)
- Modify: all files that import from `../errors/`, `../types/`, or `__tests__/utils/`

- [ ] **Step 1: Create `shared/errors/app-error.ts`** — same content as current `errors/app-error.ts` plus two new error classes

```typescript
// codegames-api/shared/errors/app-error.ts
export class AppError extends Error {
	public readonly statusCode: number;
	public readonly isOperational: boolean;

	constructor(message: string, statusCode: number, isOperational = true) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = isOperational;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export class BadRequestError extends AppError {
	constructor(message = "Bad request") {
		super(message, 400);
	}
}

export class NotFoundError extends AppError {
	constructor(message = "Resource not found") {
		super(message, 404);
	}
}

export class ValidationError extends AppError {
	public readonly fieldErrors: Record<string, string[] | undefined>;

	constructor(
		message: string,
		fieldErrors: Record<string, string[] | undefined> = {},
	) {
		super(message, 400);
		this.fieldErrors = fieldErrors;
	}
}

export class UnauthorizedError extends AppError {
	constructor(message = "Unauthorized") {
		super(message, 401);
	}
}

export class ForbiddenError extends AppError {
	constructor(message = "Forbidden") {
		super(message, 403);
	}
}

export class ExternalServiceError extends AppError {
	constructor(message = "External service error") {
		super(message, 502);
	}
}
```

- [ ] **Step 2: Create `shared/errors/app-error.test.ts`** — same content as current `errors/app-error.test.ts` plus tests for the two new classes

```typescript
// codegames-api/shared/errors/app-error.test.ts
import {
	AppError,
	BadRequestError,
	ExternalServiceError,
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
	ValidationError,
} from "./app-error";

describe("AppError", () => {
	it("stores message and statusCode", () => {
		const err = new AppError("something went wrong", 418);
		expect(err.message).toBe("something went wrong");
		expect(err.statusCode).toBe(418);
		expect(err.isOperational).toBe(true);
	});

	it("allows isOperational to be set to false", () => {
		const err = new AppError("bug", 500, false);
		expect(err.isOperational).toBe(false);
	});

	it("is an instance of Error", () => {
		expect(new AppError("x", 500)).toBeInstanceOf(Error);
	});
});

describe("BadRequestError", () => {
	it("has statusCode 400", () => {
		expect(new BadRequestError().statusCode).toBe(400);
	});

	it("uses default message", () => {
		expect(new BadRequestError().message).toBe("Bad request");
	});

	it("accepts a custom message", () => {
		expect(new BadRequestError("custom").message).toBe("custom");
	});

	it("is an instance of AppError", () => {
		expect(new BadRequestError()).toBeInstanceOf(AppError);
	});
});

describe("NotFoundError", () => {
	it("has statusCode 404", () => {
		expect(new NotFoundError().statusCode).toBe(404);
	});

	it("uses default message", () => {
		expect(new NotFoundError().message).toBe("Resource not found");
	});

	it("is an instance of AppError", () => {
		expect(new NotFoundError()).toBeInstanceOf(AppError);
	});
});

describe("ValidationError", () => {
	it("has statusCode 400", () => {
		expect(new ValidationError("invalid").statusCode).toBe(400);
	});

	it("stores fieldErrors", () => {
		const fieldErrors = { email: ["Required"] };
		const err = new ValidationError("invalid", fieldErrors);
		expect(err.fieldErrors).toEqual(fieldErrors);
	});

	it("defaults fieldErrors to empty object", () => {
		expect(new ValidationError("invalid").fieldErrors).toEqual({});
	});

	it("is an instance of AppError", () => {
		expect(new ValidationError("x")).toBeInstanceOf(AppError);
	});
});

describe("UnauthorizedError", () => {
	it("has statusCode 401", () => {
		expect(new UnauthorizedError().statusCode).toBe(401);
	});

	it("uses default message", () => {
		expect(new UnauthorizedError().message).toBe("Unauthorized");
	});

	it("is an instance of AppError", () => {
		expect(new UnauthorizedError()).toBeInstanceOf(AppError);
	});
});

describe("ForbiddenError", () => {
	it("has statusCode 403", () => {
		expect(new ForbiddenError().statusCode).toBe(403);
	});

	it("uses default message", () => {
		expect(new ForbiddenError().message).toBe("Forbidden");
	});

	it("is an instance of AppError", () => {
		expect(new ForbiddenError()).toBeInstanceOf(AppError);
	});
});

describe("ExternalServiceError", () => {
	it("has statusCode 502", () => {
		expect(new ExternalServiceError().statusCode).toBe(502);
	});

	it("uses default message", () => {
		expect(new ExternalServiceError().message).toBe("External service error");
	});

	it("is an instance of AppError", () => {
		expect(new ExternalServiceError()).toBeInstanceOf(AppError);
	});
});
```

- [ ] **Step 3: Create `shared/types/common.types.ts`**

```typescript
// codegames-api/shared/types/common.types.ts
import { NextFunction, Request, Response } from "express";

export type ControllerType<T> = (
	req: Request,
	res: Response,
	next: NextFunction,
) => Promise<T>;
```

- [ ] **Step 4: Create `shared/test-utils/test-helpers.ts`**

```typescript
// codegames-api/shared/test-utils/test-helpers.ts
import { NextFunction, Request, Response } from "express";

export const createMockRequest = (overrides: Partial<Request> = {}) =>
	({
		body: {},
		params: {},
		query: {},
		headers: {},
		...overrides,
	}) as Partial<Request>;

export const createMockResponse = () => {
	const res = {} as Response;
	(res as unknown as Record<string, jest.Mock>).status = jest
		.fn()
		.mockReturnValue(res);
	(res as unknown as Record<string, jest.Mock>).json = jest
		.fn()
		.mockReturnValue(res);
	(res as unknown as Record<string, jest.Mock>).send = jest
		.fn()
		.mockReturnValue(res);
	return res;
};

export const createMockNext = (): NextFunction => jest.fn();

export const mockProblemSummary = {
	id: "problem-id-1",
	number: 1,
	title: "Two Sum",
	slug: "two-sum",
	difficulty: "EASY" as const,
	categories: ["ARRAYS"] as const,
	isPublished: true,
	totalSubmissions: 0,
	acceptedSubmissions: 0,
	acceptanceRate: 0,
	createdAt: new Date("2024-01-01"),
};

export const mockProblemFull = {
	...mockProblemSummary,
	description: "Given an array of integers nums and an integer target...",
	examples: ["Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]"],
	constrains: "2 <= nums.length <= 10^4",
	hints: ["Use a hash map to store complements"],
	solution: "function twoSum(nums, target) { const map = {}; }",
	explanation: "We use a hash map to find the complement in O(n).",
	updatedAt: new Date("2024-01-01"),
	TestCases: [],
	StarterCodes: [],
};

export const mockTestCase = {
	id: "tc-id-1",
	problemId: "problem-id-1",
	input: "[2,7,11,15]\n9",
	expectedOutput: "[0,1]",
	isSample: true,
};

export const mockStarterCode = {
	id: "sc-id-1",
	problemId: "problem-id-1",
	language: "JAVASCRIPT" as const,
	code: "function twoSum(nums, target) {\n  // your code here\n}",
};
```

- [ ] **Step 5: Update all import paths across the codebase**

Run these sed commands from `codegames-api/`:

```bash
# errors -> shared/errors (depth 1: middleware/, code/, user/, upload/)
sed -i '' 's|from "\.\./errors/app-error"|from "../shared/errors/app-error"|g' \
  middleware/error-middleware.ts \
  middleware/error-middleware.test.ts \
  code/code.service.ts \
  code/code.service.test.ts \
  code/code.controller.ts \
  code/code.controller.test.ts \
  code/piston.service.ts \
  code/piston.service.test.ts \
  code/code.repository.test.ts \
  upload/upload.controller.ts \
  user/user.controller.ts

# errors -> shared/errors (depth 2: admin/problems/, admin/starter-codes/, admin/test-cases/)
sed -i '' 's|from "\.\.\/\.\.\/errors/app-error"|from "../../shared/errors/app-error"|g' \
  admin/problems/problems.controller.ts \
  admin/problems/problems.controller.test.ts \
  admin/starter-codes/starter-codes.controller.ts \
  admin/starter-codes/starter-codes.controller.test.ts \
  admin/test-cases/test-cases.controller.ts \
  admin/test-cases/test-cases.controller.test.ts

# types -> shared/types (depth 1)
sed -i '' 's|from "\.\./types/common.types"|from "../shared/types/common.types"|g' \
  code/code.controller.ts \
  upload/upload.controller.ts \
  user/user.controller.ts

# types -> shared/types (depth 2)
sed -i '' 's|from "\.\.\/\.\.\/types/common.types"|from "../../shared/types/common.types"|g' \
  admin/problems/problems.controller.ts \
  admin/starter-codes/starter-codes.controller.ts \
  admin/test-cases/test-cases.controller.ts

# __tests__/utils -> shared/test-utils (depth 1)
sed -i '' 's|from "\.\./\_\_tests\_\_/utils/test-helpers"|from "../shared/test-utils/test-helpers"|g' \
  code/code.service.test.ts \
  code/code.controller.test.ts \
  code/code.repository.test.ts

# __tests__/utils -> shared/test-utils (depth 2)
sed -i '' 's|from "\.\.\/\.\.\/\_\_tests\_\_/utils/test-helpers"|from "../../shared/test-utils/test-helpers"|g' \
  admin/problems/problems.controller.test.ts \
  admin/problems/problems.repository.test.ts \
  admin/problems/problems.service.test.ts \
  admin/starter-codes/starter-codes.controller.test.ts \
  admin/starter-codes/starter-codes.repository.test.ts \
  admin/starter-codes/starter-codes.service.test.ts \
  admin/test-cases/test-cases.controller.test.ts \
  admin/test-cases/test-cases.repository.test.ts \
  admin/test-cases/test-cases.service.test.ts
```

- [ ] **Step 6: Delete old folders**

```bash
rm -rf codegames-api/errors codegames-api/types codegames-api/__tests__
```

- [ ] **Step 7: Run the full test suite**

```bash
cd codegames-api && npm test
```

Expected: all tests pass (same count as before, no new failures)

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: move errors, types, test-utils into shared/ layer; add UnauthorizedError and ForbiddenError"
```

---

### Task 2: Fix `infrastructure/prisma-config.ts`

**Files:**
- Modify: `codegames-api/infrastructure/prisma-config.ts`

Three bugs fixed here: (1) two separate PrismaClient instances — PrismaService was creating its own client instead of wrapping the singleton; (2) `connect()` swallowing errors silently; (3) `console.log` instead of logger.

- [ ] **Step 1: Write a failing test for the connect error propagation bug**

Create `codegames-api/infrastructure/prisma-config.test.ts`:

```typescript
// codegames-api/infrastructure/prisma-config.test.ts
jest.mock("./prisma", () => ({
	default: {
		$connect: jest.fn(),
		$disconnect: jest.fn(),
		$queryRaw: jest.fn(),
	},
}));
jest.mock("./logger", () => ({
	default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

import prisma from "./prisma";
import PrismaService from "./prisma-config";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("PrismaService", () => {
	let service: PrismaService;

	beforeEach(() => {
		jest.clearAllMocks();
		service = new PrismaService();
	});

	describe("connect", () => {
		it("calls $connect on the shared prisma singleton", async () => {
			(mockPrisma.$connect as jest.Mock).mockResolvedValue(undefined);
			await service.connect();
			expect(mockPrisma.$connect).toHaveBeenCalledTimes(1);
		});

		it("propagates errors from $connect so startServer can fail fast", async () => {
			const dbError = new Error("Connection refused");
			(mockPrisma.$connect as jest.Mock).mockRejectedValue(dbError);
			await expect(service.connect()).rejects.toThrow("Connection refused");
		});

		it("does not call $connect a second time if already connected", async () => {
			(mockPrisma.$connect as jest.Mock).mockResolvedValue(undefined);
			await service.connect();
			await service.connect();
			expect(mockPrisma.$connect).toHaveBeenCalledTimes(1);
		});
	});

	describe("disconnect", () => {
		it("calls $disconnect on the shared prisma singleton", async () => {
			(mockPrisma.$connect as jest.Mock).mockResolvedValue(undefined);
			(mockPrisma.$disconnect as jest.Mock).mockResolvedValue(undefined);
			await service.connect();
			await service.disconnect();
			expect(mockPrisma.$disconnect).toHaveBeenCalledTimes(1);
		});
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd codegames-api && npm test -- infrastructure/prisma-config.test.ts
```

Expected: FAIL — test for "propagates errors" will fail because current implementation swallows errors

- [ ] **Step 3: Rewrite `prisma-config.ts` to fix all three bugs**

```typescript
// codegames-api/infrastructure/prisma-config.ts
import prisma from "./prisma";
import logger from "./logger";

class PrismaService {
	private isConnected: boolean = false;

	public async connect(): Promise<void> {
		if (this.isConnected) return;
		await prisma.$connect();
		this.isConnected = true;
		logger.info("Database connected successfully");
	}

	public async disconnect(): Promise<void> {
		if (!this.isConnected) return;
		await prisma.$disconnect();
		this.isConnected = false;
		logger.info("Database disconnected successfully");
	}

	public async healthCheck(): Promise<boolean> {
		try {
			await prisma.$queryRaw`SELECT 1`;
			return true;
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			logger.error("Database health check failed", {
				error: err.message,
				stack: err.stack,
			});
			return false;
		}
	}
}

export default PrismaService;
```

- [ ] **Step 4: Run the tests**

```bash
cd codegames-api && npm test -- infrastructure/prisma-config.test.ts
```

Expected: all 4 tests pass

- [ ] **Step 5: Run the full test suite to check for regressions**

```bash
cd codegames-api && npm test
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add infrastructure/prisma-config.ts infrastructure/prisma-config.test.ts
git commit -m "fix: PrismaService now wraps shared singleton, propagates connect errors, uses logger"
```

---

### Task 3: Rename `wrapper.service.ts` → `code-preparation.service.ts`

**Files:**
- Rename: `codegames-api/code/wrapper.service.ts` → `codegames-api/code/code-preparation.service.ts`
- Modify: `codegames-api/code/code.service.ts`
- Modify: `codegames-api/code/code.service.test.ts`

- [ ] **Step 1: Rename the file**

```bash
mv codegames-api/code/wrapper.service.ts codegames-api/code/code-preparation.service.ts
```

- [ ] **Step 2: Update the export in `code-preparation.service.ts`**

The class is currently `WrapperService`. Rename it to `CodePreparationService`:

Change the class declaration (line 3) from:
```typescript
class WrapperService {
```
to:
```typescript
class CodePreparationService {
```

Change the export (last line) from:
```typescript
export default WrapperService;
```
to:
```typescript
export default CodePreparationService;
```

- [ ] **Step 3: Update `code/code.service.ts`** — change import and field name

```typescript
// codegames-api/code/code.service.ts
import { Language, StarterCode, type TestCase } from "@prisma/client";
import CodeRepository from "./code.repository";
import { PistonService } from "./piston.service";
import CodePreparationService from "./code-preparation.service";
import type { CodeExecutionInput } from "./code.dto";
import { NotFoundError } from "../shared/errors/app-error";

function deepEqual(a: string, b: string): boolean {
	try {
		const parsedA = JSON.parse(a);
		const parsedB = JSON.parse(b);
		return JSON.stringify(parsedA) === JSON.stringify(parsedB);
	} catch {
		return a === b;
	}
}

export interface TestResult {
	id: string;
	passed: boolean;
	input: string;
	expected: string;
	actual: string;
}

export interface RunResult {
	allPassed: boolean;
	total: number;
	passed: number;
	failed: number;
	results: TestResult[];
	stderr?: string;
}

class CodeService {
	private readonly codeRepository: CodeRepository;
	private readonly codePreparationService: CodePreparationService;
	private readonly pistonService: PistonService;

	constructor(pistonUrl: string) {
		this.codeRepository = new CodeRepository();
		this.codePreparationService = new CodePreparationService();
		this.pistonService = new PistonService(pistonUrl);
	}

	async run(body: CodeExecutionInput): Promise<RunResult | any> {
		const { code, language, problemId } = body;
		const testCases = await this.codeRepository.getSampleTestCases(problemId);

		if (testCases.length === 0) {
			throw new NotFoundError("No test cases found for the given problem ID");
		}

		const wrappedCode = this.codePreparationService.wrapCode(
			code,
			language as Language,
			testCases,
		);

		const { stdout, stderr } = await this.pistonService.execute(
			language as Language,
			wrappedCode,
		);

		return this.compareOutputs(testCases, stdout, stderr);
	}

	async execute(body: CodeExecutionInput): Promise<any> {
		const { code, language, problemId } = body;
		const testCases = await this.codeRepository.getAllTestCases(problemId);

		if (testCases.length === 0) {
			throw new NotFoundError("No test cases found for the given problem ID");
		}

		const wrappedCode = this.codePreparationService.wrapCode(
			code,
			language as Language,
			testCases,
		);

		const { stdout, stderr } = await this.pistonService.execute(
			language as Language,
			wrappedCode,
		);

		return this.compareOutputs(testCases, stdout, stderr);
	}

	private compareOutputs(
		testArray: TestCase[],
		stdout: string,
		stderr: string,
	): RunResult {
		if (stderr) {
			return {
				total: testArray.length,
				passed: 0,
				failed: testArray.length,
				allPassed: false,
				results: testArray.map((testcase) => ({
					id: testcase.id,
					passed: false,
					input: testcase.input,
					expected: testcase.expectedOutput.trim(),
					actual: "",
				})),
				stderr,
			};
		}

		const lines = stdout.trim().split("\n");

		const results: TestResult[] = testArray.map((testcase, i) => {
			const actual = (lines[i] ?? "").trim();
			const expected = testcase.expectedOutput.trim();
			return {
				id: testcase.id,
				passed: deepEqual(actual, expected),
				input: testcase.input,
				expected,
				actual,
			};
		});

		return {
			total: testArray.length,
			passed: results.filter((r) => r.passed).length,
			failed: results.filter((r) => !r.passed).length,
			allPassed: results.every((r) => r.passed),
			results,
		};
	}

	getSupportedLanguages(): string[] {
		return Object.values(Language);
	}

	async getStarterCode(problemId: string): Promise<StarterCode[]> {
		const starterCode = await this.codeRepository.getStarterCode(problemId);
		if (!starterCode) {
			throw new NotFoundError(
				"Starter code not found for the given problem ID",
			);
		}
		return starterCode;
	}
}

export default CodeService;
```

- [ ] **Step 4: Update `code/code.service.test.ts`** — update mock path and class name

Change the three mock/import lines at the top from:
```typescript
jest.mock("./wrapper.service");
...
import WrapperService from "./wrapper.service";
...
const MockWrapperService = WrapperService as jest.MockedClass<typeof WrapperService>;
```
to:
```typescript
jest.mock("./code-preparation.service");
...
import CodePreparationService from "./code-preparation.service";
...
const MockCodePreparationService = CodePreparationService as jest.MockedClass<typeof CodePreparationService>;
```

Also update the `beforeEach` block — change:
```typescript
mockWrapper = MockWrapperService.mock.instances[0] as jest.Mocked<WrapperService>;
```
to:
```typescript
mockWrapper = MockCodePreparationService.mock.instances[0] as jest.Mocked<CodePreparationService>;
```

And rename the `mockWrapper` variable to `mockCodePrep` throughout the file (8 occurrences total — in the declaration, beforeEach, and all test assertions).

Full updated test file top section:

```typescript
import { mockTestCase } from "../shared/test-utils/test-helpers";
import { NotFoundError } from "../shared/errors/app-error";

jest.mock("./code.repository");
jest.mock("./code-preparation.service");
jest.mock("./piston.service");

import CodeRepository from "./code.repository";
import CodePreparationService from "./code-preparation.service";
import { PistonService } from "./piston.service";
import CodeService from "./code.service";

const MockCodeRepository = CodeRepository as jest.MockedClass<typeof CodeRepository>;
const MockCodePreparationService = CodePreparationService as jest.MockedClass<typeof CodePreparationService>;
const MockPistonService = PistonService as jest.MockedClass<typeof PistonService>;
```

In `beforeEach`, update to:
```typescript
beforeEach(() => {
	service = new CodeService("http://piston.test");
	mockRepo = MockCodeRepository.mock.instances[0] as jest.Mocked<CodeRepository>;
	mockCodePrep = MockCodePreparationService.mock.instances[0] as jest.Mocked<CodePreparationService>;
	mockPiston = MockPistonService.mock.instances[0] as jest.Mocked<PistonService>;
});
```

Replace all `mockWrapper.wrapCode` references with `mockCodePrep.wrapCode`.

- [ ] **Step 5: Run tests**

```bash
cd codegames-api && npm test -- code/
```

Expected: all code module tests pass

- [ ] **Step 6: Commit**

```bash
git add code/code-preparation.service.ts code/code.service.ts code/code.service.test.ts
git commit -m "refactor: rename WrapperService to CodePreparationService"
```

---

### Task 4: Deduplicate `code.service.ts` and fix return types

**Files:**
- Modify: `codegames-api/code/code.service.ts`

- [ ] **Step 1: Write a failing test that verifies `execute()` return type matches `RunResult`**

Add this test to `codegames-api/code/code.service.test.ts` inside the `execute` describe block:

```typescript
it("returns a result with total, passed, failed, allPassed, and results fields", async () => {
    mockRepo.getAllTestCases.mockResolvedValue([mockTestCase] as any);
    mockCodePrep.wrapCode.mockReturnValue("wrapped");
    mockPiston.execute.mockResolvedValue({
        stdout: mockTestCase.expectedOutput + "\n",
        stderr: "",
        exitCode: 0,
    });

    const result = await service.execute(validInput);

    expect(result).toHaveProperty("allPassed");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("passed");
    expect(result).toHaveProperty("failed");
    expect(result).toHaveProperty("results");
    expect(Array.isArray(result.results)).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it passes already (it should — this is a type-level fix)**

```bash
cd codegames-api && npm test -- code/code.service.test.ts
```

Expected: PASS — the runtime behavior is already correct; this test pins it.

- [ ] **Step 3: Refactor `code.service.ts` to extract `_runWithTestCases` and fix return types**

Replace the `run`, `execute` methods and add `_runWithTestCases` in `codegames-api/code/code.service.ts`:

```typescript
async run(body: CodeExecutionInput): Promise<RunResult> {
    const { problemId } = body;
    const testCases = await this.codeRepository.getSampleTestCases(problemId);
    if (testCases.length === 0) {
        throw new NotFoundError("No test cases found for the given problem ID");
    }
    return this._runWithTestCases(body, testCases);
}

async execute(body: CodeExecutionInput): Promise<RunResult> {
    const { problemId } = body;
    const testCases = await this.codeRepository.getAllTestCases(problemId);
    if (testCases.length === 0) {
        throw new NotFoundError("No test cases found for the given problem ID");
    }
    return this._runWithTestCases(body, testCases);
}

private async _runWithTestCases(
    body: CodeExecutionInput,
    testCases: TestCase[],
): Promise<RunResult> {
    const { code, language } = body;
    const wrappedCode = this.codePreparationService.wrapCode(
        code,
        language as Language,
        testCases,
    );
    const { stdout, stderr } = await this.pistonService.execute(
        language as Language,
        wrappedCode,
    );
    return this.compareOutputs(testCases, stdout, stderr);
}
```

- [ ] **Step 4: Run the full code service test suite**

```bash
cd codegames-api && npm test -- code/code.service.test.ts
```

Expected: all tests pass (same count as before)

- [ ] **Step 5: Commit**

```bash
git add code/code.service.ts code/code.service.test.ts
git commit -m "refactor: deduplicate run/execute in CodeService, fix return types to RunResult"
```

---

### Task 5: Fix env config, rate limiter, and route names

**Files:**
- Modify: `codegames-api/infrastructure/env-config.ts`
- Modify: `codegames-api/middleware/rate-limit-middleware.ts`
- Modify: `codegames-api/code/code.route.ts`

- [ ] **Step 1: Write a failing test for `SALT_ROUNDS` validation**

Add to `codegames-api/infrastructure/env-config.test.ts` (create this file):

```typescript
// codegames-api/infrastructure/env-config.test.ts
import { validateEnv } from "./env-config";

const validEnv = {
	NODE_ENV: "test",
	API_PORT: "4000",
	ADMIN_ROUTE: "/admin_secret_route",
	API_VERSION: "v1",
	DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
	JWT_SECRET: "supersecretjwtsecret",
	EMAIL_USER: "test@example.com",
	EMAIL_PASSWORD: "password",
	PISTON_URL: "http://localhost:2000",
	MINIO_ENDPOINT: "http://localhost:9000",
	MINIO_ROOT_USER: "minioadmin",
	MINIO_ROOT_PASSWORD: "minioadmin",
	MINIO_BUCKET: "codegames",
	MINIO_PUBLIC_URL: "http://localhost:9000",
	SALT_ROUNDS: "10",
};

describe("validateEnv", () => {
	it("parses a valid env successfully", () => {
		const config = validateEnv(validEnv);
		expect(config.API_PORT).toBe(4000);
		expect(config.SALT_ROUNDS).toBe(10);
	});

	it("throws when SALT_ROUNDS is missing", () => {
		const { SALT_ROUNDS, ...withoutSalt } = validEnv;
		expect(() => validateEnv(withoutSalt)).toThrow();
	});

	it("throws when SALT_ROUNDS is not a number", () => {
		expect(() => validateEnv({ ...validEnv, SALT_ROUNDS: "abc" })).toThrow();
	});

	it("throws when SALT_ROUNDS is less than 1", () => {
		expect(() => validateEnv({ ...validEnv, SALT_ROUNDS: "0" })).toThrow();
	});

	it("throws when API_PORT is out of range", () => {
		expect(() => validateEnv({ ...validEnv, API_PORT: "99999" })).toThrow();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd codegames-api && npm test -- infrastructure/env-config.test.ts
```

Expected: FAIL — "throws when SALT_ROUNDS is missing" passes trivially but "parses a valid env — config.SALT_ROUNDS is 10" will fail because SALT_ROUNDS doesn't exist in the schema yet.

- [ ] **Step 3: Add `SALT_ROUNDS` to `env-config.ts`**

```typescript
// codegames-api/infrastructure/env-config.ts
import { z } from "zod";

const envSchema = z.object({
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.optional()
		.default("development"),
	API_PORT: z.string().transform((val) => {
		const port = Number(val);
		if (Number.isNaN(port) || port < 1 || port > 65535) {
			throw new Error("API_PORT must be a valid port number (1-65535)");
		}
		return port;
	}),
	ADMIN_ROUTE: z.string().min(1, "ADMIN_ROUTE is required and cannot be empty"),
	API_VERSION: z.string().min(1, "API_VERSION is required and cannot be empty"),
	DATABASE_URL: z.url("DATABASE_URL must be a valid URL"),
	JWT_SECRET: z
		.string()
		.min(16, "JWT_SECRET must be at least 16 characters for security"),
	EMAIL_USER: z.email("EMAIL_USER must be a valid email address"),
	EMAIL_PASSWORD: z.string().min(1, "EMAIL_PASSWORD is required"),
	DUMMY_EMAIL: z.email("DUMMY_EMAIL must be a valid email address").optional(),
	PISTON_URL: z.url("PISTON_URL must be a valid URL"),
	SALT_ROUNDS: z.string().transform((val) => {
		const rounds = Number(val);
		if (Number.isNaN(rounds) || rounds < 1) {
			throw new Error("SALT_ROUNDS must be a positive integer");
		}
		return rounds;
	}),
	MINIO_ENDPOINT: z.url("MINIO_ENDPOINT must be a valid URL"),
	MINIO_ROOT_USER: z.string().min(1, "MINIO_ROOT_USER is required"),
	MINIO_ROOT_PASSWORD: z.string().min(1, "MINIO_ROOT_PASSWORD is required"),
	MINIO_BUCKET: z.string().min(1, "MINIO_BUCKET is required").default("codegames"),
	MINIO_PUBLIC_URL: z.url("MINIO_PUBLIC_URL must be a valid URL"),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(env: Partial<NodeJS.ProcessEnv>): EnvConfig {
	return envSchema.parse(env);
}
```

- [ ] **Step 4: Run env tests**

```bash
cd codegames-api && npm test -- infrastructure/env-config.test.ts
```

Expected: all 5 tests pass

- [ ] **Step 5: Fix rate limiter — use `limit` consistently in `rate-limit-middleware.ts`**

```typescript
// codegames-api/middleware/rate-limit-middleware.ts
import rateLimit from "express-rate-limit";

export const generalRateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 100,
	standardHeaders: true,
	legacyHeaders: false,
});

export const codeSubmissionRateLimiter = rateLimit({
	windowMs: 60 * 1000,
	limit: 10,
	standardHeaders: true,
	legacyHeaders: false,
	message: "Too many code submissions from this IP, please try again after a minute",
});
```

- [ ] **Step 6: Fix route names in `code/code.route.ts`**

```typescript
// codegames-api/code/code.route.ts
import { Router } from "express";
import CodeController from "./code.controller";
import { codeSubmissionRateLimiter } from "../middleware/rate-limit-middleware";

const router = Router();

router.get("/health-check", CodeController.healthCheck);
router.post("/execute", codeSubmissionRateLimiter, CodeController.executeCode);
router.post("/run", codeSubmissionRateLimiter, CodeController.runCode);
router.get("/languages", CodeController.getSupportedLanguages);
router.get("/starter-code/:problemId", CodeController.getStarterCode);

export const codeRouter = router;
```

- [ ] **Step 7: Run the full test suite**

```bash
cd codegames-api && npm test
```

Expected: all tests pass

- [ ] **Step 8: Commit**

```bash
git add infrastructure/env-config.ts infrastructure/env-config.test.ts \
        middleware/rate-limit-middleware.ts code/code.route.ts
git commit -m "fix: add SALT_ROUNDS to env validation, use limit in rate limiters, fix route names to be RESTful"
```

---

### Task 6: Fix dotenv loading order

**Files:**
- Modify: `codegames-api/index.ts`

Currently `env.config()` is called after all imports, meaning module-level code in imported files runs before `.env` is loaded. This means `process.env.PISTON_URL!` in `CodeController`'s static field is read before `.env` is parsed.

- [ ] **Step 1: Update `index.ts` to load dotenv before all other imports**

```typescript
// codegames-api/index.ts
import "dotenv/config"; // Must be first — loads .env before any other module runs

import ExpressInstance from "./infrastructure/express-config";
import PrismaInstance from "./infrastructure/prisma-config";
import { validateEnv } from "./infrastructure/env-config";
import UploadService from "./upload/upload.service";

type StartServerResult = {
	server: ExpressInstance;
	prisma: PrismaInstance;
};

const startServer = async (): Promise<StartServerResult> => {
	const config = validateEnv(process.env);

	const serverInstance = new ExpressInstance(config);
	const prismaInstance = new PrismaInstance();

	await prismaInstance.connect();

	const uploadService = new UploadService();
	await uploadService.ensureBucket();

	serverInstance.start();

	return {
		server: serverInstance,
		prisma: prismaInstance,
	};
};

const gracefulShutdown = async (
	signal: string,
	{ server, prisma }: StartServerResult,
) => {
	console.log(`Received ${signal}. Shutting down gracefully...`);
	await prisma.disconnect();
	await server.stop();
	process.exit(0);
};

startServer()
	.then((instances) => {
		process.on("SIGTERM", (signal) => gracefulShutdown(signal, instances));
		process.on("SIGINT", (signal) => gracefulShutdown(signal, instances));
	})
	.catch((error) => {
		console.error("Failed to start server", {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : "No stack trace",
		});
		process.exit(1);
	});
```

- [ ] **Step 2: Verify dotenv is listed as a dependency (it already is)**

```bash
cd codegames-api && node -e "require('dotenv/config'); console.log('ok')"
```

Expected: prints `ok` with no errors

- [ ] **Step 3: Commit**

```bash
git add index.ts
git commit -m "fix: load dotenv before any module imports to ensure process.env is populated at class-load time"
```

---

### Task 7: Create `auth/` module

**Files:**
- Create: `codegames-api/auth/auth.dto.ts`
- Create: `codegames-api/auth/auth.repository.ts`
- Create: `codegames-api/auth/auth.service.ts`
- Create: `codegames-api/auth/auth.controller.ts`
- Create: `codegames-api/auth/auth.controller.test.ts`
- Create: `codegames-api/auth/auth.route.ts`
- Create: `codegames-api/auth/index.ts`
- Modify: `codegames-api/infrastructure/express-config.ts`

- [ ] **Step 1: Create `auth/auth.dto.ts`**

```typescript
// codegames-api/auth/auth.dto.ts
import { z } from "zod";

export const RegisterSchema = z.object({
	username: z.string().min(3, "Username must be at least 3 characters").max(50),
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	email: z.email("Invalid email address"),
	password: z
		.string()
		.min(6, "Password must be at least 6 characters long")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[a-z]/, "Password must contain at least one lowercase letter")
		.regex(/[0-9]/, "Password must contain at least one number")
		.regex(/[@$!%*?&]/, "Password must contain at least one special character"),
	country: z.string().optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
```

- [ ] **Step 2: Create `auth/auth.repository.ts`**

```typescript
// codegames-api/auth/auth.repository.ts
import prisma from "../infrastructure/prisma";

export type RegisterUserData = {
	username: string;
	email: string;
	passwordHash: string;
	firstName: string;
	lastName: string;
	profilePictureUrl?: string | null;
	country?: string | null;
};

export class AuthRepository {
	registerUser(data: RegisterUserData) {
		return prisma.user.create({ data });
	}
}
```

- [ ] **Step 3: Create `auth/auth.service.ts`**

```typescript
// codegames-api/auth/auth.service.ts
import { UploadService } from "../upload";
import { RegisterInput } from "./auth.dto";
import { AuthRepository } from "./auth.repository";
import bcrypt from "bcryptjs";

export class AuthService {
	private static readonly uploadService = new UploadService();
	private static readonly authRepository = new AuthRepository();

	public static readonly register = async (
		userInfo: RegisterInput,
		profileImage?: Express.Multer.File,
	) => {
		const saltRounds = parseInt(process.env.SALT_ROUNDS!, 10);
		const passwordHash = await bcrypt.hash(userInfo.password, saltRounds);
		const profilePictureUrl = profileImage
			? await AuthService.uploadToS3(profileImage)
			: null;

		return AuthService.authRepository.registerUser({
			username: userInfo.username,
			email: userInfo.email,
			passwordHash,
			firstName: userInfo.firstName,
			lastName: userInfo.lastName,
			profilePictureUrl,
			country: userInfo.country ?? null,
		});
	};

	private static async uploadToS3(file: Express.Multer.File): Promise<string> {
		const { url } = await AuthService.uploadService.upload(file, "user-avatars");
		return url;
	}
}
```

- [ ] **Step 4: Write failing test for `auth/auth.controller.ts`**

Create `codegames-api/auth/auth.controller.test.ts`:

```typescript
// codegames-api/auth/auth.controller.test.ts
import {
	createMockNext,
	createMockRequest,
	createMockResponse,
} from "../shared/test-utils/test-helpers";
import { ValidationError } from "../shared/errors/app-error";

jest.mock("./auth.service");

import { AuthService } from "./auth.service";
import AuthController from "./auth.controller";

const mockRegister = AuthService.register as jest.MockedFunction<typeof AuthService.register>;

const validBody = {
	username: "johndoe",
	firstName: "John",
	lastName: "Doe",
	email: "john@example.com",
	password: "Secret1!",
};

describe("AuthController", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("register", () => {
		it("returns 201 with success message for valid input", async () => {
			mockRegister.mockResolvedValue({} as any);

			const req = createMockRequest({ body: validBody });
			const res = createMockResponse();

			await AuthController.register(req as any, res as any, createMockNext());

			expect(mockRegister).toHaveBeenCalledWith(
				expect.objectContaining({ username: validBody.username }),
				undefined,
			);
			expect((res as any).status).toHaveBeenCalledWith(201);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				message: "User registered successfully",
			});
		});

		it("throws ValidationError for missing required fields", async () => {
			const req = createMockRequest({ body: { email: "bad" } });
			const res = createMockResponse();

			await expect(
				AuthController.register(req as any, res as any, createMockNext()),
			).rejects.toBeInstanceOf(ValidationError);

			expect(mockRegister).not.toHaveBeenCalled();
		});

		it("throws ValidationError when password lacks uppercase letter", async () => {
			const req = createMockRequest({
				body: { ...validBody, password: "secret1!" },
			});
			const res = createMockResponse();

			await expect(
				AuthController.register(req as any, res as any, createMockNext()),
			).rejects.toBeInstanceOf(ValidationError);
		});
	});
});
```

- [ ] **Step 5: Run the test to verify it fails**

```bash
cd codegames-api && npm test -- auth/auth.controller.test.ts
```

Expected: FAIL — `auth.controller.ts` does not exist yet

- [ ] **Step 6: Create `auth/auth.controller.ts`**

```typescript
// codegames-api/auth/auth.controller.ts
import { z } from "zod";
import { ControllerType } from "../shared/types/common.types";
import { ValidationError } from "../shared/errors/app-error";
import { RegisterSchema } from "./auth.dto";
import { AuthService } from "./auth.service";

class AuthController {
	static readonly register: ControllerType<void> = async (req, res) => {
		const parsed = RegisterSchema.safeParse(req.body);
		if (!parsed.success) {
			throw new ValidationError(
				"Invalid input",
				z.flattenError(parsed.error).fieldErrors,
			);
		}
		await AuthService.register(parsed.data, req.file);
		res.status(201).json({ status: "success", message: "User registered successfully" });
	};
}

export default AuthController;
```

- [ ] **Step 7: Run the auth controller tests**

```bash
cd codegames-api && npm test -- auth/auth.controller.test.ts
```

Expected: all 3 tests pass

- [ ] **Step 8: Create `auth/auth.route.ts`**

```typescript
// codegames-api/auth/auth.route.ts
import Router from "express";
import { imageUpload } from "../upload/multer-config";
import AuthController from "./auth.controller";

const router = Router();

router.post("/register", imageUpload.single("profileImage"), AuthController.register);

export const authRouter = router;
```

- [ ] **Step 9: Create `auth/index.ts`**

```typescript
// codegames-api/auth/index.ts
export { authRouter } from "./auth.route";
```

- [ ] **Step 10: Update `infrastructure/express-config.ts`** — mount `authRouter` at `/auth`

```typescript
// codegames-api/infrastructure/express-config.ts
import express, { Express } from "express";
import { EnvConfig } from "./env-config";
import { Server } from "node:http";
import { adminRouter } from "../admin";
import { codeRouter } from "../code";
import { uploadRouter } from "../upload";
import { authRouter } from "../auth";
import { errorMiddleware } from "../middleware/error-middleware";
import { requestLogger } from "../middleware/request-logger";
import helmet from "helmet";
import logger from "./logger";
import { generalRateLimiter } from "../middleware/rate-limit-middleware";

class ExpressServer {
	private readonly app: Express;
	private readonly config: EnvConfig;
	private server: Server | null = null;

	constructor(config: EnvConfig) {
		this.config = config;
		this.app = express();
		this.setupMiddleware();
		this.setupRoutes();
		this.setupErrorHandling();
	}

	private setupMiddleware() {
		this.app.use(helmet());
		this.app.use(requestLogger);
		this.app.use(generalRateLimiter);
		this.app.use(express.json());
	}

	private setupRoutes() {
		const { API_VERSION, ADMIN_ROUTE } = this.config;
		this.app.use(`/api/${API_VERSION}${ADMIN_ROUTE}`, adminRouter);
		this.app.use(`/api/${API_VERSION}/code`, codeRouter);
		this.app.use(`/api/${API_VERSION}/upload`, uploadRouter);
		this.app.use(`/api/${API_VERSION}/auth`, authRouter);
	}

	private setupErrorHandling() {
		this.app.use(errorMiddleware);
	}

	public start(): void {
		this.server = this.app.listen(this.config.API_PORT, () => {
			logger.info(`Server is running on port ${this.config.API_PORT}`);
		});
	}

	public stop(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.server) return resolve();
			this.server.close((err) => (err ? reject(err) : resolve()));
		});
	}
}

export default ExpressServer;
```

- [ ] **Step 11: Run the full test suite**

```bash
cd codegames-api && npm test
```

Expected: all tests pass

- [ ] **Step 12: Commit**

```bash
git add auth/
git add infrastructure/express-config.ts
git commit -m "feat: extract auth module with register endpoint, mount at /api/v1/auth"
```

---

### Task 8: Slim down `user/` module

**Files:**
- Modify: `codegames-api/user/user.controller.ts`
- Modify: `codegames-api/user/user.service.ts`
- Modify: `codegames-api/user/user.dto.ts`
- Modify: `codegames-api/user/user.repository.ts`
- Modify: `codegames-api/user/user.route.ts`
- Modify: `codegames-api/user/index.ts`

- [ ] **Step 1: Update `user/user.repository.ts`** — replace register logic with profile stub

```typescript
// codegames-api/user/user.repository.ts
import prisma from "../infrastructure/prisma";

export class UserRepository {
	findById(id: string) {
		return prisma.user.findUnique({ where: { id } });
	}
}
```

- [ ] **Step 2: Update `user/user.service.ts`**

```typescript
// codegames-api/user/user.service.ts
// Profile and account management — not yet implemented
export class UserService {}
```

- [ ] **Step 3: Update `user/user.dto.ts`**

```typescript
// codegames-api/user/user.dto.ts
// Profile DTOs — not yet implemented
```

- [ ] **Step 4: Update `user/user.controller.ts`**

```typescript
// codegames-api/user/user.controller.ts
// Profile endpoints — not yet implemented
```

- [ ] **Step 5: Update `user/user.route.ts`**

```typescript
// codegames-api/user/user.route.ts
import Router from "express";

const router = Router();

// Profile routes — not yet implemented

export default router;
```

- [ ] **Step 6: Update `user/index.ts`**

```typescript
// codegames-api/user/index.ts
export { UserService } from "./user.service";
export { default as userRouter } from "./user.route";
```

- [ ] **Step 7: Run the full test suite**

```bash
cd codegames-api && npm test
```

Expected: all tests pass

- [ ] **Step 8: Commit**

```bash
git add user/
git commit -m "refactor: slim user module to profile placeholder; auth logic now lives in auth/"
```

---

### Task 9: Add Prisma scripts to `package.json`

**Files:**
- Modify: `codegames-api/package.json`

- [ ] **Step 1: Add three new scripts to `package.json`**

In the `"scripts"` block, add after the existing `"seed"` entry:

```json
"migrate:dev":   "prisma migrate dev",
"migrate:reset": "prisma migrate reset",
"migrate:new":   "prisma migrate dev --create-only --name"
```

Full updated `scripts` block:

```json
"scripts": {
    "dev": "nodemon",
    "generate": "prisma generate",
    "build": "tsc",
    "lint": "eslint . --ext .ts",
    "test": "jest",
    "test:watch": "jest --watchAll",
    "seed": "npx tsx prisma/seed.ts",
    "migrate:dev": "prisma migrate dev",
    "migrate:reset": "prisma migrate reset",
    "migrate:new": "prisma migrate dev --create-only --name"
}
```

- [ ] **Step 2: Verify the scripts are parseable**

```bash
cd codegames-api && node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('valid JSON')"
```

Expected: prints `valid JSON`

- [ ] **Step 3: Smoke-test `migrate:new`**

```bash
cd codegames-api && npm run migrate:new -- test_script_works 2>&1 | head -5
```

Expected: Prisma CLI output (not a JSON parse error). You can Ctrl-C or let it exit. Delete any migration file it created if this runs against a live DB.

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: add migrate:dev, migrate:reset, migrate:new npm scripts"
```

---

## Self-Review

**Spec coverage:**
- [x] Section 1 (Directory layout) — Tasks 1, 7, 8 move all files as specified
- [x] Section 2 (Auth/User split) — Task 7 creates auth module, Task 8 slims user
- [x] Section 3 (Code module rename) — Task 3
- [x] Section 4 (Prisma scripts) — Task 9
- [x] Section 5 (Import path updates) — Task 1, Step 5
- [x] Section 6 Bug 1 (Two PrismaClient instances) — Task 2
- [x] Section 6 Bug 2 (connect() swallows errors) — Task 2
- [x] Section 6 Fix 3 (Deduplicate run/execute) — Task 4
- [x] Section 6 Fix 4 (Return types) — Task 4
- [x] Section 6 Fix 5 (SALT_ROUNDS validation) — Task 5
- [x] Section 6 Fix 6 (console.log → logger) — Task 2
- [x] Section 6 Fix 7 (rate limiter max → limit) — Task 5
- [x] Section 6 Fix 8 (dotenv order) — Task 6
- [x] Section 6 Fix 9 (UnauthorizedError/ForbiddenError) — Task 1
- [x] Section 6 Fix 10 (RESTful route names) — Task 5

**Type consistency:**
- `AuthService.register` is called in `AuthController.register` with `(parsed.data, req.file)` — matches definition `(userInfo: RegisterInput, profileImage?: Express.Multer.File)`
- `authRouter` is exported from `auth/index.ts` and imported in `express-config.ts` — consistent
- `CodePreparationService` is the class name in `code-preparation.service.ts` and the type in `code.service.ts` — consistent
- `RunResult` return type used in `run()`, `execute()`, and `_runWithTestCases()` — consistent
