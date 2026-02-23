import { mockStarterCode } from "../../__tests__/utils/test-helpers";

jest.mock("../../infrastructure/prisma", () => ({
	__esModule: true,
	default: {
		starterCode: {
			findMany: jest.fn(),
			create: jest.fn(),
			createMany: jest.fn(),
		},
	},
}));

import prisma from "../../infrastructure/prisma";
import StarterCodesRepository from "./starter-codes.repository";

const db = prisma as unknown as {
	starterCode: Record<string, jest.Mock>;
};

describe("StarterCodesRepository", () => {
	let repository: StarterCodesRepository;

	beforeEach(() => {
		repository = new StarterCodesRepository();
	});

	describe("getStarterCodesByProblemId", () => {
		it("returns all starter codes for a problem", async () => {
			db.starterCode.findMany.mockResolvedValue([mockStarterCode]);

			const result = await repository.getStarterCodesByProblemId("problem-id-1");

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

			const result = await repository.bulkAddStarterCodesToProblem("problem-id-1", starterCodes);

			expect(result).toEqual({ count: 2 });
			expect(db.starterCode.createMany).toHaveBeenCalledWith({
				data: [
					{ problemId: "problem-id-1", language: "JAVASCRIPT", code: "function twoSum() {}" },
					{ problemId: "problem-id-1", language: "PYTHON", code: "def two_sum():" },
				],
				skipDuplicates: true,
			});
		});
	});
});
