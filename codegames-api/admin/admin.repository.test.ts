import {
	mockProblemFull,
	mockProblemSummary,
	mockStarterCode,
	mockTestCase,
} from "../__tests__/utils/test-helpers";

jest.mock("../infrastructure/prisma", () => ({
	__esModule: true,
	default: {
		problem: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		},
		testCase: {
			findMany: jest.fn(),
			create: jest.fn(),
			createMany: jest.fn(),
		},
		starterCode: {
			findMany: jest.fn(),
			create: jest.fn(),
			createMany: jest.fn(),
		},
	},
}));

import prisma from "../infrastructure/prisma";
import AdminRepository from "./admin.repository";

const db = prisma as unknown as {
	problem: Record<string, jest.Mock>;
	testCase: Record<string, jest.Mock>;
	starterCode: Record<string, jest.Mock>;
};

describe("AdminRepository", () => {
	let repository: AdminRepository;

	beforeEach(() => {
		repository = new AdminRepository();
	});

	// ─── Problems ────────────────────────────────────────────────────────────────

	describe("getAllProblems", () => {
		it("returns problems ordered by number with the list select", async () => {
			db.problem.findMany.mockResolvedValue([mockProblemSummary]);

			const result = await repository.getAllProblems();

			expect(result).toEqual([mockProblemSummary]);
			expect(db.problem.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ orderBy: { number: "asc" } }),
			);
		});
	});

	describe("queryProblems", () => {
		it("applies no filters when none are provided", async () => {
			db.problem.findMany.mockResolvedValue([mockProblemSummary]);

			await repository.queryProblems({});

			expect(db.problem.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ where: {} }),
			);
		});

		it("filters by difficulty", async () => {
			db.problem.findMany.mockResolvedValue([mockProblemSummary]);

			await repository.queryProblems({ difficulty: "EASY" });

			expect(db.problem.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ where: { difficulty: "EASY" } }),
			);
		});

		it("filters by isPublished", async () => {
			db.problem.findMany.mockResolvedValue([]);

			await repository.queryProblems({ isPublished: false });

			expect(db.problem.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ where: { isPublished: false } }),
			);
		});

		it("filters by categories using hasSome", async () => {
			db.problem.findMany.mockResolvedValue([mockProblemSummary]);

			await repository.queryProblems({ categories: ["ARRAYS", "STRINGS"] });

			expect(db.problem.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { categories: { hasSome: ["ARRAYS", "STRINGS"] } },
				}),
			);
		});

		it("filters by search term across title and slug", async () => {
			db.problem.findMany.mockResolvedValue([mockProblemSummary]);

			await repository.queryProblems({ search: "two sum" });

			expect(db.problem.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						OR: [
							{
								title: {
									contains: "two sum",
									mode: "insensitive",
								},
							},
							{
								slug: {
									contains: "two sum",
									mode: "insensitive",
								},
							},
						],
					},
				}),
			);
		});
	});

	describe("getProblemById", () => {
		it("returns the problem with TestCases included", async () => {
			const problemWithCases = { ...mockProblemFull, TestCases: [mockTestCase] };
			db.problem.findUnique.mockResolvedValue(problemWithCases);

			const result = await repository.getProblemById("problem-id-1");

			expect(result).toEqual(problemWithCases);
			expect(db.problem.findUnique).toHaveBeenCalledWith({
				where: { id: "problem-id-1" },
				include: { TestCases: true },
			});
		});

		it("returns null when problem does not exist", async () => {
			db.problem.findUnique.mockResolvedValue(null);

			const result = await repository.getProblemById("nonexistent");

			expect(result).toBeNull();
		});
	});

	describe("createProblem", () => {
		it("creates a problem and returns it with TestCases and StarterCodes", async () => {
			db.problem.create.mockResolvedValue(mockProblemFull);

			const result = await repository.createProblem(mockProblemFull as any);

			expect(result).toEqual(mockProblemFull);
			expect(db.problem.create).toHaveBeenCalledWith({
				data: mockProblemFull,
				include: { TestCases: true, StarterCodes: true },
			});
		});
	});

	describe("updateProblem", () => {
		it("updates the correct problem with the provided data", async () => {
			const updated = { ...mockProblemFull, title: "Updated Title" };
			db.problem.update.mockResolvedValue(updated);

			const result = await repository.updateProblem("problem-id-1", {
				title: "Updated Title",
			});

			expect(result).toEqual(updated);
			expect(db.problem.update).toHaveBeenCalledWith({
				where: { id: "problem-id-1" },
				data: { title: "Updated Title" },
			});
		});
	});

	describe("deleteProblem", () => {
		it("deletes the correct problem", async () => {
			db.problem.delete.mockResolvedValue(mockProblemFull);

			await repository.deleteProblem("problem-id-1");

			expect(db.problem.delete).toHaveBeenCalledWith({
				where: { id: "problem-id-1" },
			});
		});
	});

	// ─── Test Cases ──────────────────────────────────────────────────────────────

	describe("getTestCasesByProblemId", () => {
		it("returns all test cases for a problem", async () => {
			db.testCase.findMany.mockResolvedValue([mockTestCase]);

			const result = await repository.getTestCasesByProblemId("problem-id-1");

			expect(result).toEqual([mockTestCase]);
			expect(db.testCase.findMany).toHaveBeenCalledWith({
				where: { problemId: "problem-id-1" },
			});
		});
	});

	describe("addTestCaseToProblem", () => {
		it("creates a test case connected to the problem", async () => {
			db.testCase.create.mockResolvedValue(mockTestCase);

			const result = await repository.addTestCaseToProblem("problem-id-1", {
				input: "[2,7,11,15]\n9",
				expectedOutput: "[0,1]",
				isSample: true,
			});

			expect(result).toEqual(mockTestCase);
			expect(db.testCase.create).toHaveBeenCalledWith({
				data: {
					input: "[2,7,11,15]\n9",
					expectedOutput: "[0,1]",
					isSample: true,
					problem: { connect: { id: "problem-id-1" } },
				},
			});
		});

		it("defaults isSample to false when not provided", async () => {
			db.testCase.create.mockResolvedValue({ ...mockTestCase, isSample: false });

			await repository.addTestCaseToProblem("problem-id-1", {
				input: "5",
				expectedOutput: "10",
			});

			expect(db.testCase.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({ isSample: false }),
				}),
			);
		});
	});

	describe("bulkAddTestCasesToProblem", () => {
		it("bulk inserts all test cases with the correct problemId", async () => {
			db.testCase.createMany.mockResolvedValue({ count: 2 });

			const testCases = [
				{ input: "[2,7]\n9", expectedOutput: "[0,1]", isSample: true },
				{ input: "[3,2,4]\n6", expectedOutput: "[1,2]" },
			];

			const result = await repository.bulkAddTestCasesToProblem(
				"problem-id-1",
				testCases,
			);

			expect(result).toEqual({ count: 2 });
			expect(db.testCase.createMany).toHaveBeenCalledWith({
				data: [
					{
						problemId: "problem-id-1",
						input: "[2,7]\n9",
						expectedOutput: "[0,1]",
						isSample: true,
					},
					{
						problemId: "problem-id-1",
						input: "[3,2,4]\n6",
						expectedOutput: "[1,2]",
						isSample: false,
					},
				],
			});
		});
	});

	// ─── Starter Codes ───────────────────────────────────────────────────────────

	describe("getStarterCodesByProblemId", () => {
		it("returns all starter codes for a problem", async () => {
			db.starterCode.findMany.mockResolvedValue([mockStarterCode]);

			const result =
				await repository.getStarterCodesByProblemId("problem-id-1");

			expect(result).toEqual([mockStarterCode]);
			expect(db.starterCode.findMany).toHaveBeenCalledWith({
				where: { problemId: "problem-id-1" },
			});
		});
	});

	describe("addStarterCodeToProblem", () => {
		it("creates a starter code connected to the problem", async () => {
			db.starterCode.create.mockResolvedValue(mockStarterCode);

			const result = await repository.addStarterCodeToProblem("problem-id-1", {
				language: "JAVASCRIPT",
				code: "function twoSum() {}",
			});

			expect(result).toEqual(mockStarterCode);
			expect(db.starterCode.create).toHaveBeenCalledWith({
				data: {
					language: "JAVASCRIPT",
					code: "function twoSum() {}",
					problem: { connect: { id: "problem-id-1" } },
				},
			});
		});
	});

	describe("bulkAddStarterCodesToProblem", () => {
		it("bulk inserts starter codes and skips duplicates", async () => {
			db.starterCode.createMany.mockResolvedValue({ count: 2 });

			const starterCodes = [
				{ language: "JAVASCRIPT" as const, code: "function twoSum() {}" },
				{ language: "PYTHON" as const, code: "def two_sum():" },
			];

			const result = await repository.bulkAddStarterCodesToProblem(
				"problem-id-1",
				starterCodes,
			);

			expect(result).toEqual({ count: 2 });
			expect(db.starterCode.createMany).toHaveBeenCalledWith({
				data: [
					{
						problemId: "problem-id-1",
						language: "JAVASCRIPT",
						code: "function twoSum() {}",
					},
					{
						problemId: "problem-id-1",
						language: "PYTHON",
						code: "def two_sum():",
					},
				],
				skipDuplicates: true,
			});
		});
	});
});
