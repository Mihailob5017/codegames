import { mockTestCase } from "../../__tests__/utils/test-helpers";

jest.mock("../../infrastructure/prisma", () => ({
	__esModule: true,
	default: {
		testCase: {
			findMany: jest.fn(),
			create: jest.fn(),
			createMany: jest.fn(),
		},
	},
}));

import prisma from "../../infrastructure/prisma";
import TestCasesRepository from "./test-cases.repository";

const db = prisma as unknown as {
	testCase: Record<string, jest.Mock>;
};

describe("TestCasesRepository", () => {
	let repository: TestCasesRepository;

	beforeEach(() => {
		repository = new TestCasesRepository();
	});

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

			const result = await repository.bulkAddTestCasesToProblem("problem-id-1", testCases);

			expect(result).toEqual({ count: 2 });
			expect(db.testCase.createMany).toHaveBeenCalledWith({
				data: [
					{ problemId: "problem-id-1", input: "[2,7]\n9", expectedOutput: "[0,1]", isSample: true },
					{ problemId: "problem-id-1", input: "[3,2,4]\n6", expectedOutput: "[1,2]", isSample: false },
				],
			});
		});
	});
});
