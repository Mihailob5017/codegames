import {
	createMockNext,
	createMockRequest,
	createMockResponse,
	mockProblemFull,
	mockProblemSummary,
} from "../../../shared/test-utils/test-helpers";
import {
	NotFoundError,
	ValidationError,
} from "../../../shared/errors/app-error";

jest.mock("../problems.service");

import ProblemsService from "../problems.service";
import ProblemsController from "../problems.controller";

const MockProblemsService = ProblemsService as jest.MockedClass<
	typeof ProblemsService
>;

let mockService: jest.Mocked<ProblemsService>;

describe("ProblemsController", () => {
	beforeAll(() => {
		mockService = MockProblemsService.mock
			.instances[0] as jest.Mocked<ProblemsService>;
	});

	// ─── GET /problems ────────────────────────────────────────────────────────

	describe("getProblems", () => {
		it("returns 200 with paginated problems", async () => {
			const paginatedResult = {
				data: [mockProblemSummary],
				pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
			};
			mockService.getAllProblems.mockResolvedValue(
				paginatedResult as any,
			);

			const req = createMockRequest();
			const res = createMockResponse();

			await ProblemsController.getProblems(
				req as any,
				res as any,
				createMockNext(),
			);

			expect((res as any).status).toHaveBeenCalledWith(200);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				data: [mockProblemSummary],
				pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
			});
		});
	});

	// ─── GET /problems/search ─────────────────────────────────────────────────

	describe("queryProblems", () => {
		it("returns 200 with filtered paginated problems for valid query params", async () => {
			const paginatedResult = {
				data: [mockProblemSummary],
				pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
			};
			mockService.queryProblems.mockResolvedValue(paginatedResult as any);

			const req = createMockRequest({
				query: { difficulty: "EASY", isPublished: "true" },
			});
			const res = createMockResponse();

			await ProblemsController.queryProblems(
				req as any,
				res as any,
				createMockNext(),
			);

			expect((res as any).status).toHaveBeenCalledWith(200);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				data: [mockProblemSummary],
				pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
			});
		});

		it("throws ValidationError when difficulty is invalid", async () => {
			const req = createMockRequest({
				query: { difficulty: "LEGENDARY" },
			});
			const res = createMockResponse();

			await expect(
				ProblemsController.queryProblems(
					req as any,
					res as any,
					createMockNext(),
				),
			).rejects.toBeInstanceOf(ValidationError);
		});

		it("returns 200 with an empty list when no problems match", async () => {
			mockService.queryProblems.mockResolvedValue({
				data: [],
				pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
			} as any);

			const req = createMockRequest({ query: { search: "nonexistent" } });
			const res = createMockResponse();

			await ProblemsController.queryProblems(
				req as any,
				res as any,
				createMockNext(),
			);

			expect((res as any).status).toHaveBeenCalledWith(200);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				data: [],
				pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
			});
		});
	});

	// ─── GET /problems/:id ────────────────────────────────────────────────────

	describe("getProblemById", () => {
		it("returns 200 with the problem when found", async () => {
			mockService.getProblemById.mockResolvedValue(
				mockProblemFull as any,
			);

			const req = createMockRequest({ params: { id: "problem-id-1" } });
			const res = createMockResponse();

			await ProblemsController.getProblemById(
				req as any,
				res as any,
				createMockNext(),
			);

			expect((res as any).status).toHaveBeenCalledWith(200);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				data: mockProblemFull,
			});
		});

		it("throws NotFoundError when the problem does not exist", async () => {
			mockService.getProblemById.mockResolvedValue(null);

			const req = createMockRequest({ params: { id: "nonexistent" } });
			const res = createMockResponse();

			await expect(
				ProblemsController.getProblemById(
					req as any,
					res as any,
					createMockNext(),
				),
			).rejects.toBeInstanceOf(NotFoundError);
		});
	});

	// ─── POST /problems ───────────────────────────────────────────────────────

	describe("createProblem", () => {
		const validBody = {
			title: "Two Sum",
			slug: "two-sum",
			description: "Given an array of integers...",
			examples: ["Input: [2,7,11,15], target=9 Output: [0,1]"],
			constrains: "2 <= nums.length <= 10^4",
			hints: ["Use a hash map"],
			difficulty: "EASY",
			categories: ["ARRAYS"],
			solution: "function twoSum(nums, target) {}",
			explanation: "Hash map approach.",
			isPublished: false,
		};

		it("returns 201 with the created problem for a valid body", async () => {
			mockService.createProblem.mockResolvedValue(mockProblemFull as any);

			const req = createMockRequest({ body: validBody });
			const res = createMockResponse();

			await ProblemsController.createProblem(
				req as any,
				res as any,
				createMockNext(),
			);

			expect((res as any).status).toHaveBeenCalledWith(201);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				data: mockProblemFull,
			});
		});

		it("passes testCases and starterCodes to the service", async () => {
			mockService.createProblem.mockResolvedValue(mockProblemFull as any);

			const body = {
				...validBody,
				testCases: [
					{ input: "1", expectedOutput: "2", isSample: false },
				],
				starterCodes: [
					{ language: "JAVASCRIPT", code: "function f() {}" },
				],
			};
			const req = createMockRequest({ body });
			const res = createMockResponse();

			await ProblemsController.createProblem(
				req as any,
				res as any,
				createMockNext(),
			);

			expect(mockService.createProblem).toHaveBeenCalledWith(
				expect.objectContaining({
					testCases: body.testCases,
					starterCodes: body.starterCodes,
				}),
			);
		});

		it("throws ValidationError when required fields are missing", async () => {
			const req = createMockRequest({ body: { title: "Two Sum" } });
			const res = createMockResponse();

			await expect(
				ProblemsController.createProblem(
					req as any,
					res as any,
					createMockNext(),
				),
			).rejects.toBeInstanceOf(ValidationError);

			expect(mockService.createProblem).not.toHaveBeenCalled();
		});

		it("throws ValidationError when difficulty is invalid", async () => {
			const req = createMockRequest({
				body: { ...validBody, difficulty: "LEGENDARY" },
			});
			const res = createMockResponse();

			await expect(
				ProblemsController.createProblem(
					req as any,
					res as any,
					createMockNext(),
				),
			).rejects.toBeInstanceOf(ValidationError);
		});
	});

	// ─── PUT /problems/:id ────────────────────────────────────────────────────

	describe("updateProblem", () => {
		it("returns 200 with the updated problem", async () => {
			const updated = { ...mockProblemFull, title: "Two Sum Updated" };
			mockService.updateProblem.mockResolvedValue(updated as any);

			const req = createMockRequest({
				params: { id: "problem-id-1" },
				body: { title: "Two Sum Updated" },
			});
			const res = createMockResponse();

			await ProblemsController.updateProblem(
				req as any,
				res as any,
				createMockNext(),
			);

			expect((res as any).status).toHaveBeenCalledWith(200);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				data: updated,
			});
		});

		it("throws ValidationError when no update fields are provided", async () => {
			const req = createMockRequest({
				params: { id: "problem-id-1" },
				body: {},
			});
			const res = createMockResponse();

			await expect(
				ProblemsController.updateProblem(
					req as any,
					res as any,
					createMockNext(),
				),
			).rejects.toBeInstanceOf(ValidationError);

			expect(mockService.updateProblem).not.toHaveBeenCalled();
		});
	});

	// ─── DELETE /problems/:id ─────────────────────────────────────────────────

	describe("deleteProblem", () => {
		it("returns 200 with a success message", async () => {
			mockService.deleteProblem.mockResolvedValue(undefined as any);

			const req = createMockRequest({ params: { id: "problem-id-1" } });
			const res = createMockResponse();

			await ProblemsController.deleteProblem(
				req as any,
				res as any,
				createMockNext(),
			);

			expect((res as any).status).toHaveBeenCalledWith(200);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				message: "Problem deleted",
			});
		});
	});
});
