import {
	mockProblemFull,
	mockProblemSummary,
} from "../../../shared/test-utils/test-helpers";

jest.mock("../problems.repository");

import ProblemsRepository from "../problems.repository";
import ProblemsService from "../problems.service";

const MockProblemsRepository = ProblemsRepository as jest.MockedClass<
	typeof ProblemsRepository
>;

describe("ProblemsService", () => {
	let service: ProblemsService;
	let mockRepo: jest.Mocked<ProblemsRepository>;

	beforeEach(() => {
		service = new ProblemsService();
		mockRepo = MockProblemsRepository.mock
			.instances[0] as jest.Mocked<ProblemsRepository>;
	});

	describe("getAllProblems", () => {
		it("delegates to repository.getAllProblems", async () => {
			mockRepo.getAllProblems.mockResolvedValue([mockProblemSummary] as any);

			const result = await service.getAllProblems();

			expect(result).toEqual([mockProblemSummary]);
			expect(mockRepo.getAllProblems).toHaveBeenCalledTimes(1);
		});
	});

	describe("queryProblems", () => {
		it("delegates filters to repository.queryProblems", async () => {
			const filters = { difficulty: "EASY" as const, isPublished: true };
			mockRepo.queryProblems.mockResolvedValue([mockProblemSummary] as any);

			const result = await service.queryProblems(filters);

			expect(result).toEqual([mockProblemSummary]);
			expect(mockRepo.queryProblems).toHaveBeenCalledWith(filters);
		});
	});

	describe("getProblemById", () => {
		it("delegates to repository.getProblemById", async () => {
			mockRepo.getProblemById.mockResolvedValue(mockProblemFull as any);

			const result = await service.getProblemById("problem-id-1");

			expect(result).toEqual(mockProblemFull);
			expect(mockRepo.getProblemById).toHaveBeenCalledWith("problem-id-1");
		});
	});

	describe("createProblem", () => {
		const baseInput = {
			title: "Two Sum",
			slug: "two-sum",
			description: "Given an array...",
			examples: ["Example 1"],
			constrains: "2 <= nums.length",
			hints: ["Use a hash map"],
			difficulty: "EASY" as const,
			categories: ["ARRAYS" as const],
			solution: "function twoSum() {}",
			explanation: "We use a hash map.",
			isPublished: false,
		};

		it("passes only core fields when testCases and starterCodes are empty", async () => {
			mockRepo.createProblem.mockResolvedValue(mockProblemFull as any);

			await service.createProblem({ ...baseInput, testCases: [], starterCodes: [] });

			expect(mockRepo.createProblem).toHaveBeenCalledWith(
				expect.not.objectContaining({ TestCases: expect.anything() }),
			);
			expect(mockRepo.createProblem).toHaveBeenCalledWith(
				expect.not.objectContaining({ StarterCodes: expect.anything() }),
			);
		});

		it("includes nested TestCases when testCases are provided", async () => {
			mockRepo.createProblem.mockResolvedValue(mockProblemFull as any);
			const testCases = [{ input: "[2,7]\n9", expectedOutput: "[0,1]", isSample: true }];

			await service.createProblem({ ...baseInput, testCases, starterCodes: [] });

			expect(mockRepo.createProblem).toHaveBeenCalledWith(
				expect.objectContaining({ TestCases: { create: testCases } }),
			);
		});

		it("includes nested StarterCodes when starterCodes are provided", async () => {
			mockRepo.createProblem.mockResolvedValue(mockProblemFull as any);
			const starterCodes = [{ language: "JAVASCRIPT" as const, code: "function f() {}" }];

			await service.createProblem({ ...baseInput, testCases: [], starterCodes });

			expect(mockRepo.createProblem).toHaveBeenCalledWith(
				expect.objectContaining({ StarterCodes: { create: starterCodes } }),
			);
		});

		it("includes both nested creates when both arrays are provided", async () => {
			mockRepo.createProblem.mockResolvedValue(mockProblemFull as any);
			const testCases = [{ input: "1", expectedOutput: "2", isSample: false }];
			const starterCodes = [{ language: "PYTHON" as const, code: "def f():" }];

			await service.createProblem({ ...baseInput, testCases, starterCodes });

			expect(mockRepo.createProblem).toHaveBeenCalledWith(
				expect.objectContaining({
					TestCases: { create: testCases },
					StarterCodes: { create: starterCodes },
				}),
			);
		});
	});

	describe("updateProblem", () => {
		it("delegates to repository.updateProblem", async () => {
			mockRepo.updateProblem.mockResolvedValue(mockProblemFull as any);

			const result = await service.updateProblem("problem-id-1", { title: "Updated" });

			expect(result).toEqual(mockProblemFull);
			expect(mockRepo.updateProblem).toHaveBeenCalledWith("problem-id-1", { title: "Updated" });
		});
	});

	describe("deleteProblem", () => {
		it("delegates to repository.deleteProblem", async () => {
			mockRepo.deleteProblem.mockResolvedValue(mockProblemFull as any);

			await service.deleteProblem("problem-id-1");

			expect(mockRepo.deleteProblem).toHaveBeenCalledWith("problem-id-1");
		});
	});
});
