import {
	createMockNext,
	createMockRequest,
	createMockResponse,
	mockProblemFull,
	mockProblemSummary,
	mockStarterCode,
	mockTestCase,
} from "../__tests__/utils/test-helpers";

jest.mock("./admin.service");

import AdminService from "./admin.service";
import AdminController from "./admin.controller";

const MockAdminService = AdminService as jest.MockedClass<typeof AdminService>;

// AdminController.adminService is a private static field initialised once at module
// load time. clearMocks resets mock.instances between tests, so we capture the
// reference once in beforeAll while it's still there.
let mockService: jest.Mocked<AdminService>;

describe("AdminController", () => {
	beforeAll(() => {
		mockService = MockAdminService.mock
			.instances[0] as jest.Mocked<AdminService>;
	});

	// ─── Health Check ─────────────────────────────────────────────────────────

	describe("healthCheck", () => {
		it("responds 200 with a message", async () => {
			const req = createMockRequest();
			const res = createMockResponse();

			await AdminController.healthCheck(req as any, res as any, createMockNext());

			expect((res as any).status).toHaveBeenCalledWith(200);
			expect((res as any).send).toHaveBeenCalled();
		});
	});

	// ─── GET /problems ────────────────────────────────────────────────────────

	describe("getProblems", () => {
		it("returns 200 with all problems", async () => {
			mockService.getAllProblems.mockResolvedValue([
				mockProblemSummary,
			] as any);

			const req = createMockRequest();
			const res = createMockResponse();

			await AdminController.getProblems(req as any, res as any, createMockNext());

			expect((res as any).status).toHaveBeenCalledWith(200);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				data: [mockProblemSummary],
			});
		});
	});

	// ─── GET /problems/search ─────────────────────────────────────────────────

	describe("queryProblems", () => {
		it("returns 200 with filtered problems for valid query params", async () => {
			mockService.queryProblems.mockResolvedValue([
				mockProblemSummary,
			] as any);

			const req = createMockRequest({
				query: { difficulty: "EASY", isPublished: "true" },
			});
			const res = createMockResponse();

			await AdminController.queryProblems(req as any, res as any, createMockNext());

			expect((res as any).status).toHaveBeenCalledWith(200);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				data: [mockProblemSummary],
			});
		});

		it("returns 400 when difficulty is invalid", async () => {
			const req = createMockRequest({ query: { difficulty: "LEGENDARY" } });
			const res = createMockResponse();

			await AdminController.queryProblems(req as any, res as any, createMockNext());

			expect((res as any).status).toHaveBeenCalledWith(400);
			expect((res as any).json).toHaveBeenCalledWith(
				expect.objectContaining({ status: "error" }),
			);
		});

		it("returns 200 with an empty list when no problems match", async () => {
			mockService.queryProblems.mockResolvedValue([]);

			const req = createMockRequest({ query: { search: "nonexistent" } });
			const res = createMockResponse();

			await AdminController.queryProblems(req as any, res as any, createMockNext());

			expect((res as any).status).toHaveBeenCalledWith(200);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				data: [],
			});
		});
	});

	// ─── GET /problems/:id ────────────────────────────────────────────────────

	describe("getProblemById", () => {
		it("returns 200 with the problem when found", async () => {
			mockService.getProblemById.mockResolvedValue(mockProblemFull as any);

			const req = createMockRequest({ params: { id: "problem-id-1" } });
			const res = createMockResponse();

			await AdminController.getProblemById(req as any, res as any, createMockNext());

			expect((res as any).status).toHaveBeenCalledWith(200);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				data: mockProblemFull,
			});
		});

		it("returns 404 when the problem does not exist", async () => {
			mockService.getProblemById.mockResolvedValue(null);

			const req = createMockRequest({ params: { id: "nonexistent" } });
			const res = createMockResponse();

			await AdminController.getProblemById(req as any, res as any, createMockNext());

			expect((res as any).status).toHaveBeenCalledWith(404);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "error",
				message: "Problem not found",
			});
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

			await AdminController.createProblem(req as any, res as any, createMockNext());

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
				testCases: [{ input: "1", expectedOutput: "2", isSample: false }],
				starterCodes: [{ language: "JAVASCRIPT", code: "function f() {}" }],
			};
			const req = createMockRequest({ body });
			const res = createMockResponse();

			await AdminController.createProblem(req as any, res as any, createMockNext());

			expect(mockService.createProblem).toHaveBeenCalledWith(
				expect.objectContaining({
					testCases: body.testCases,
					starterCodes: body.starterCodes,
				}),
			);
		});

		it("returns 400 when required fields are missing", async () => {
			const req = createMockRequest({ body: { title: "Two Sum" } });
			const res = createMockResponse();

			await AdminController.createProblem(req as any, res as any, createMockNext());

			expect((res as any).status).toHaveBeenCalledWith(400);
			expect((res as any).json).toHaveBeenCalledWith(
				expect.objectContaining({ status: "error" }),
			);
			expect(mockService.createProblem).not.toHaveBeenCalled();
		});

		it("returns 400 when difficulty is invalid", async () => {
			const req = createMockRequest({
				body: { ...validBody, difficulty: "LEGENDARY" },
			});
			const res = createMockResponse();

			await AdminController.createProblem(req as any, res as any, createMockNext());

			expect((res as any).status).toHaveBeenCalledWith(400);
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

			await AdminController.updateProblem(req as any, res as any, createMockNext());

			expect((res as any).status).toHaveBeenCalledWith(200);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				data: updated,
			});
		});
	});

	// ─── DELETE /problems/:id ─────────────────────────────────────────────────

	describe("deleteProblem", () => {
		it("returns 200 with a success message", async () => {
			mockService.deleteProblem.mockResolvedValue(undefined as any);

			const req = createMockRequest({ params: { id: "problem-id-1" } });
			const res = createMockResponse();

			await AdminController.deleteProblem(req as any, res as any, createMockNext());

			expect((res as any).status).toHaveBeenCalledWith(200);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				message: "Problem deleted",
			});
		});
	});

	// ─── Test Cases ───────────────────────────────────────────────────────────

	describe("getTestCasesByProblemId", () => {
		it("returns 200 with the test cases", async () => {
			mockService.getTestCasesByProblemId.mockResolvedValue([
				mockTestCase,
			] as any);

			const req = createMockRequest({ params: { id: "problem-id-1" } });
			const res = createMockResponse();

			await AdminController.getTestCasesByProblemId(
				req as any,
				res as any,
				createMockNext(),
			);

			expect((res as any).status).toHaveBeenCalledWith(200);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				data: [mockTestCase],
			});
		});
	});

	describe("addTestCaseToProblem", () => {
		it("returns 201 with the created test case", async () => {
			mockService.addTestCaseToProblem.mockResolvedValue(
				mockTestCase as any,
			);

			const req = createMockRequest({
				params: { id: "problem-id-1" },
				body: { input: "[2,7]\n9", expectedOutput: "[0,1]", isSample: true },
			});
			const res = createMockResponse();

			await AdminController.addTestCaseToProblem(
				req as any,
				res as any,
				createMockNext(),
			);

			expect((res as any).status).toHaveBeenCalledWith(201);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				data: mockTestCase,
			});
		});
	});

	describe("bulkAddTestCasesToProblem", () => {
		it("returns 201 with the insert count for a valid array", async () => {
			mockService.bulkAddTestCasesToProblem.mockResolvedValue({ count: 2 });

			const req = createMockRequest({
				params: { id: "problem-id-1" },
				body: [
					{ input: "[2,7]\n9", expectedOutput: "[0,1]", isSample: true },
					{ input: "[3,2,4]\n6", expectedOutput: "[1,2]", isSample: false },
				],
			});
			const res = createMockResponse();

			await AdminController.bulkAddTestCasesToProblem(
				req as any,
				res as any,
				createMockNext(),
			);

			expect((res as any).status).toHaveBeenCalledWith(201);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				data: { count: 2 },
			});
		});

		it("returns 400 when body is an empty array", async () => {
			const req = createMockRequest({
				params: { id: "problem-id-1" },
				body: [],
			});
			const res = createMockResponse();

			await AdminController.bulkAddTestCasesToProblem(
				req as any,
				res as any,
				createMockNext(),
			);

			expect((res as any).status).toHaveBeenCalledWith(400);
			expect(mockService.bulkAddTestCasesToProblem).not.toHaveBeenCalled();
		});

		it("returns 400 when body is not an array", async () => {
			const req = createMockRequest({
				params: { id: "problem-id-1" },
				body: { input: "1", expectedOutput: "2" },
			});
			const res = createMockResponse();

			await AdminController.bulkAddTestCasesToProblem(
				req as any,
				res as any,
				createMockNext(),
			);

			expect((res as any).status).toHaveBeenCalledWith(400);
		});
	});

	// ─── Starter Codes ────────────────────────────────────────────────────────

	describe("getStarterCodesByProblemId", () => {
		it("returns 200 with starter codes", async () => {
			mockService.getStarterCodesByProblemId.mockResolvedValue([
				mockStarterCode,
			] as any);

			const req = createMockRequest({ params: { id: "problem-id-1" } });
			const res = createMockResponse();

			await AdminController.getStarterCodesByProblemId(
				req as any,
				res as any,
				createMockNext(),
			);

			expect((res as any).status).toHaveBeenCalledWith(200);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				data: [mockStarterCode],
			});
		});
	});

	describe("addStarterCodeToProblem", () => {
		it("returns 201 with the created starter code", async () => {
			mockService.addStarterCodeToProblem.mockResolvedValue(
				mockStarterCode as any,
			);

			const req = createMockRequest({
				params: { id: "problem-id-1" },
				body: { language: "JAVASCRIPT", code: "function twoSum() {}" },
			});
			const res = createMockResponse();

			await AdminController.addStarterCodeToProblem(
				req as any,
				res as any,
				createMockNext(),
			);

			expect((res as any).status).toHaveBeenCalledWith(201);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				data: mockStarterCode,
			});
		});
	});

	describe("bulkAddStarterCodesToProblem", () => {
		it("returns 201 with the insert count for a valid array", async () => {
			mockService.bulkAddStarterCodesToProblem.mockResolvedValue({
				count: 2,
			});

			const req = createMockRequest({
				params: { id: "problem-id-1" },
				body: [
					{ language: "JAVASCRIPT", code: "function twoSum() {}" },
					{ language: "PYTHON", code: "def two_sum():" },
				],
			});
			const res = createMockResponse();

			await AdminController.bulkAddStarterCodesToProblem(
				req as any,
				res as any,
				createMockNext(),
			);

			expect((res as any).status).toHaveBeenCalledWith(201);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				data: { count: 2 },
			});
		});

		it("returns 400 when body is an empty array", async () => {
			const req = createMockRequest({
				params: { id: "problem-id-1" },
				body: [],
			});
			const res = createMockResponse();

			await AdminController.bulkAddStarterCodesToProblem(
				req as any,
				res as any,
				createMockNext(),
			);

			expect((res as any).status).toHaveBeenCalledWith(400);
			expect(
				mockService.bulkAddStarterCodesToProblem,
			).not.toHaveBeenCalled();
		});

		it("returns 400 when language is invalid", async () => {
			const req = createMockRequest({
				params: { id: "problem-id-1" },
				body: [{ language: "COBOL", code: "IDENTIFICATION DIVISION." }],
			});
			const res = createMockResponse();

			await AdminController.bulkAddStarterCodesToProblem(
				req as any,
				res as any,
				createMockNext(),
			);

			expect((res as any).status).toHaveBeenCalledWith(400);
		});
	});
});
