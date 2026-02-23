import {
	mockProblemFull,
	mockProblemSummary,
	mockStarterCode,
	mockTestCase,
} from "../__tests__/utils/test-helpers";

jest.mock("./admin.repository");

import AdminRepository from "./admin.repository";
import AdminService from "./admin.service";

const MockAdminRepository = AdminRepository as jest.MockedClass<
	typeof AdminRepository
>;

describe("AdminService", () => {
	let service: AdminService;
	let mockRepo: jest.Mocked<AdminRepository>;

	beforeEach(() => {
		service = new AdminService();
		mockRepo = MockAdminRepository.mock
			.instances[0] as jest.Mocked<AdminRepository>;
	});

	// ─── Problems ────────────────────────────────────────────────────────────────

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

			await service.createProblem({
				...baseInput,
				testCases: [],
				starterCodes: [],
			});

			expect(mockRepo.createProblem).toHaveBeenCalledWith(
				expect.not.objectContaining({ TestCases: expect.anything() }),
			);
			expect(mockRepo.createProblem).toHaveBeenCalledWith(
				expect.not.objectContaining({ StarterCodes: expect.anything() }),
			);
		});

		it("includes nested TestCases create when testCases are provided", async () => {
			mockRepo.createProblem.mockResolvedValue(mockProblemFull as any);
			const testCases = [
				{ input: "[2,7]\n9", expectedOutput: "[0,1]", isSample: true },
			];

			await service.createProblem({ ...baseInput, testCases, starterCodes: [] });

			expect(mockRepo.createProblem).toHaveBeenCalledWith(
				expect.objectContaining({
					TestCases: { create: testCases },
				}),
			);
		});

		it("includes nested StarterCodes create when starterCodes are provided", async () => {
			mockRepo.createProblem.mockResolvedValue(mockProblemFull as any);
			const starterCodes = [
				{ language: "JAVASCRIPT" as const, code: "function twoSum() {}" },
			];

			await service.createProblem({
				...baseInput,
				testCases: [],
				starterCodes,
			});

			expect(mockRepo.createProblem).toHaveBeenCalledWith(
				expect.objectContaining({
					StarterCodes: { create: starterCodes },
				}),
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

			const result = await service.updateProblem("problem-id-1", {
				title: "Updated",
			});

			expect(result).toEqual(mockProblemFull);
			expect(mockRepo.updateProblem).toHaveBeenCalledWith("problem-id-1", {
				title: "Updated",
			});
		});
	});

	describe("deleteProblem", () => {
		it("delegates to repository.deleteProblem", async () => {
			mockRepo.deleteProblem.mockResolvedValue(mockProblemFull as any);

			await service.deleteProblem("problem-id-1");

			expect(mockRepo.deleteProblem).toHaveBeenCalledWith("problem-id-1");
		});
	});

	// ─── Test Cases ──────────────────────────────────────────────────────────────

	describe("getTestCasesByProblemId", () => {
		it("delegates to repository.getTestCasesByProblemId", async () => {
			mockRepo.getTestCasesByProblemId.mockResolvedValue([mockTestCase] as any);

			const result = await service.getTestCasesByProblemId("problem-id-1");

			expect(result).toEqual([mockTestCase]);
			expect(mockRepo.getTestCasesByProblemId).toHaveBeenCalledWith(
				"problem-id-1",
			);
		});
	});

	describe("addTestCaseToProblem", () => {
		it("delegates to repository.addTestCaseToProblem", async () => {
			mockRepo.addTestCaseToProblem.mockResolvedValue(mockTestCase as any);
			const data = { input: "1", expectedOutput: "2", isSample: false };

			const result = await service.addTestCaseToProblem("problem-id-1", data);

			expect(result).toEqual(mockTestCase);
			expect(mockRepo.addTestCaseToProblem).toHaveBeenCalledWith(
				"problem-id-1",
				data,
			);
		});
	});

	describe("bulkAddTestCasesToProblem", () => {
		it("delegates to repository.bulkAddTestCasesToProblem", async () => {
			mockRepo.bulkAddTestCasesToProblem.mockResolvedValue({ count: 2 });
			const testCases = [
				{ input: "1", expectedOutput: "2", isSample: false },
				{ input: "3", expectedOutput: "4", isSample: true },
			];

			const result = await service.bulkAddTestCasesToProblem(
				"problem-id-1",
				testCases,
			);

			expect(result).toEqual({ count: 2 });
			expect(mockRepo.bulkAddTestCasesToProblem).toHaveBeenCalledWith(
				"problem-id-1",
				testCases,
			);
		});
	});

	// ─── Starter Codes ───────────────────────────────────────────────────────────

	describe("getStarterCodesByProblemId", () => {
		it("delegates to repository.getStarterCodesByProblemId", async () => {
			mockRepo.getStarterCodesByProblemId.mockResolvedValue([
				mockStarterCode,
			] as any);

			const result = await service.getStarterCodesByProblemId("problem-id-1");

			expect(result).toEqual([mockStarterCode]);
			expect(mockRepo.getStarterCodesByProblemId).toHaveBeenCalledWith(
				"problem-id-1",
			);
		});
	});

	describe("addStarterCodeToProblem", () => {
		it("delegates to repository.addStarterCodeToProblem", async () => {
			mockRepo.addStarterCodeToProblem.mockResolvedValue(mockStarterCode as any);
			const data = { language: "JAVASCRIPT" as const, code: "function f() {}" };

			const result = await service.addStarterCodeToProblem(
				"problem-id-1",
				data,
			);

			expect(result).toEqual(mockStarterCode);
			expect(mockRepo.addStarterCodeToProblem).toHaveBeenCalledWith(
				"problem-id-1",
				data,
			);
		});
	});

	describe("bulkAddStarterCodesToProblem", () => {
		it("delegates to repository.bulkAddStarterCodesToProblem", async () => {
			mockRepo.bulkAddStarterCodesToProblem.mockResolvedValue({ count: 2 });
			const starterCodes = [
				{ language: "JAVASCRIPT" as const, code: "function f() {}" },
				{ language: "PYTHON" as const, code: "def f():" },
			];

			const result = await service.bulkAddStarterCodesToProblem(
				"problem-id-1",
				starterCodes,
			);

			expect(result).toEqual({ count: 2 });
			expect(mockRepo.bulkAddStarterCodesToProblem).toHaveBeenCalledWith(
				"problem-id-1",
				starterCodes,
			);
		});
	});
});
