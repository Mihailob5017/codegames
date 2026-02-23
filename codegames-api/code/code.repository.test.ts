import { mockTestCase } from "../__tests__/utils/test-helpers";

jest.mock("../infrastructure/prisma", () => ({
	__esModule: true,
	default: {
		testCase: {
			findMany: jest.fn(),
		},
	},
}));

import prisma from "../infrastructure/prisma";
import CodeRepository from "./code.repository";

const db = prisma as unknown as {
	testCase: Record<string, jest.Mock>;
};

describe("CodeRepository", () => {
	let repository: CodeRepository;

	beforeEach(() => {
		repository = new CodeRepository();
	});

	describe("getSampleTestCases", () => {
		it("returns only sample test cases for the given problem", async () => {
			db.testCase.findMany.mockResolvedValue([mockTestCase]);

			const result = await repository.getSampleTestCases("problem-id-1");

			expect(result).toEqual([mockTestCase]);
			expect(db.testCase.findMany).toHaveBeenCalledWith({
				where: { problemId: "problem-id-1", isSample: true },
			});
		});
	});

	describe("getAllTestCases", () => {
		it("returns all test cases for the given problem", async () => {
			db.testCase.findMany.mockResolvedValue([mockTestCase]);

			const result = await repository.getAllTestCases("problem-id-1");

			expect(result).toEqual([mockTestCase]);
			expect(db.testCase.findMany).toHaveBeenCalledWith({
				where: { problemId: "problem-id-1" },
			});
		});
	});
});
