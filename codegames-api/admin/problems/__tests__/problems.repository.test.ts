import {
	mockProblemFull,
	mockProblemSummary,
	mockTestCase,
} from "../../../shared/test-utils/test-helpers";

jest.mock("../../../infrastructure/prisma", () => ({
	__esModule: true,
	default: {
		problem: {
			findMany: jest.fn(),
			findUnique: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		},
	},
}));

import prisma from "../../../infrastructure/prisma";
import ProblemsRepository from "../problems.repository";

const db = prisma as unknown as {
	problem: Record<string, jest.Mock>;
};

describe("ProblemsRepository", () => {
	let repository: ProblemsRepository;

	beforeEach(() => {
		repository = new ProblemsRepository();
	});

	describe("getAllProblems", () => {
		it("returns problems ordered by number", async () => {
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
							{ title: { contains: "two sum", mode: "insensitive" } },
							{ slug: { contains: "two sum", mode: "insensitive" } },
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

			const result = await repository.updateProblem("problem-id-1", { title: "Updated Title" });

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
});
