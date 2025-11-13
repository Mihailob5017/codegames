import { Request, Response, NextFunction } from "express";
import { CodeController } from "./code-controller";
import { CodeService } from "../../services/code/code-service";
import { AuthRequest } from "../../middlewares/auth-middleware";
import { ResponseObject } from "../../types/common/controller-types";
import {
	createMockRequest,
	createMockResponse,
	createMockNext,
} from "../../__tests__/utils/test-helpers";
import { extractTokenFromRequest } from "../../middlewares/auth-middleware";
import { verifyJWT } from "../../utils/auth";

jest.mock("../../services/code/code-service");
jest.mock("../../middlewares/auth-middleware");
jest.mock("../../utils/auth");

describe("CodeController", () => {
	let mockCodeService: jest.Mocked<CodeService>;
	let req: any;
	let res: any;
	let next: any;

	beforeEach(() => {
		mockCodeService = {
			runSingleTestCase: jest.fn(),
			runAllTestCases: jest.fn(),
			submitCodeSolution: jest.fn(),
		} as any;

		// Mock the static codeService property directly
		Object.defineProperty(CodeController, 'codeService', {
			value: mockCodeService,
			writable: true,
			configurable: true
		});

		req = createMockRequest();
		res = createMockResponse();
		next = createMockNext();

		jest.spyOn(ResponseObject, "success").mockReturnValue({
			send: jest.fn(),
		} as any);

		(extractTokenFromRequest as jest.Mock).mockReturnValue("valid-jwt-token");
		(verifyJWT as jest.Mock).mockReturnValue({ id: "test-user-id" });
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe("runTestCase", () => {
		it("should run a single test case successfully", async () => {
			const mockTestCase = {
				testCaseId: "test-1",
				passed: true,
				input: { nums: [1, 2, 3] },
				expectedOutput: 6,
				actualOutput: 6,
				executionTime: 150,
			};

			mockCodeService.runSingleTestCase.mockResolvedValue(mockTestCase);

			req.body = {
				problemId: "problem-1",
				userCode:
					"function solution(nums) { return nums.reduce((a, b) => a + b, 0); }",
				language: "javascript",
			};

			await CodeController.runTestCase(req, res, next);

			expect(mockCodeService.runSingleTestCase).toHaveBeenCalledWith({
				problemId: "problem-1",
				userCode:
					"function solution(nums) { return nums.reduce((a, b) => a + b, 0); }",
				language: "javascript",
			});
			expect(ResponseObject.success).toHaveBeenCalledWith(
				200,
				"Test case executed successfully",
				mockTestCase
			);
		});

		it("should handle validation errors for missing problemId", async () => {
			req.body = {
				problemId: "",
				userCode: "function solution() {}",
				language: "javascript",
			};

			await CodeController.runTestCase(req, res, next);

			expect(next).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 400,
					message: "Validation error",
				})
			);
		});

		it("should handle validation errors for invalid language", async () => {
			req.body = {
				problemId: "problem-1",
				userCode: "function solution() {}",
				language: "invalid",
			};

			await CodeController.runTestCase(req, res, next);

			expect(next).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 400,
					message: "Validation error",
				})
			);
		});

		it("should handle service errors", async () => {
			const error = new Error("Service error");
			mockCodeService.runSingleTestCase.mockRejectedValue(error);

			req.body = {
				problemId: "problem-1",
				userCode: "function solution() {}",
				language: "javascript",
			};

			await CodeController.runTestCase(req, res, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe("runAllTestCases", () => {
		it("should run all test cases successfully", async () => {
			const mockResult = {
				success: true,
				totalTests: 3,
				passedTests: 3,
				testResults: [
					{
						testCaseId: "test-1",
						passed: true,
						input: { nums: [1, 2, 3] },
						expectedOutput: 6,
						actualOutput: 6,
						executionTime: 150,
					},
					{
						testCaseId: "test-2",
						passed: true,
						input: { nums: [4, 5] },
						expectedOutput: 9,
						actualOutput: 9,
						executionTime: 120,
					},
					{
						testCaseId: "test-3",
						passed: true,
						input: { nums: [] },
						expectedOutput: 0,
						actualOutput: 0,
						executionTime: 100,
					},
				],
				overallExecutionTime: 450,
			};

			mockCodeService.runAllTestCases.mockResolvedValue(mockResult);

			req.body = {
				problemId: "problem-1",
				userCode:
					"function solution(nums) { return nums.reduce((a, b) => a + b, 0); }",
				language: "javascript",
			};

			await CodeController.runAllTestCases(req, res, next);

			expect(mockCodeService.runAllTestCases).toHaveBeenCalledWith({
				problemId: "problem-1",
				userCode:
					"function solution(nums) { return nums.reduce((a, b) => a + b, 0); }",
				language: "javascript",
			});
			expect(ResponseObject.success).toHaveBeenCalledWith(
				200,
				"All test cases executed successfully",
				mockResult
			);
		});

		it("should handle partial test case failures", async () => {
			const mockResult = {
				success: false,
				totalTests: 3,
				passedTests: 2,
				testResults: [
					{
						testCaseId: "test-1",
						passed: true,
						input: { nums: [1, 2, 3] },
						expectedOutput: 6,
						actualOutput: 6,
						executionTime: 150,
					},
					{
						testCaseId: "test-2",
						passed: true,
						input: { nums: [4, 5] },
						expectedOutput: 9,
						actualOutput: 9,
						executionTime: 120,
					},
					{
						testCaseId: "test-3",
						passed: false,
						input: { nums: [] },
						expectedOutput: 0,
						actualOutput: undefined,
						executionTime: 0,
						error: "TypeError: Cannot read property",
					},
				],
				overallExecutionTime: 350,
			};

			mockCodeService.runAllTestCases.mockResolvedValue(mockResult);

			req.body = {
				problemId: "problem-1",
				userCode: "function solution(nums) { return nums[0] + nums[1]; }",
				language: "javascript",
			};

			await CodeController.runAllTestCases(req, res, next);

			expect(mockCodeService.runAllTestCases).toHaveBeenCalled();
			expect(ResponseObject.success).toHaveBeenCalledWith(
				200,
				"All test cases executed successfully",
				mockResult
			);
		});

		it("should handle validation errors", async () => {
			req.body = {
				problemId: "",
				userCode: "",
				language: "invalid",
			};

			await CodeController.runAllTestCases(req, res, next);

			expect(next).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 400,
					message: "Validation error",
				})
			);
		});

		it("should handle service errors", async () => {
			const error = new Error("Failed to execute test cases");
			mockCodeService.runAllTestCases.mockRejectedValue(error);

			req.body = {
				problemId: "problem-1",
				userCode: "function solution() {}",
				language: "javascript",
			};

			await CodeController.runAllTestCases(req, res, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe("submitSolution", () => {
		it("should submit solution successfully with authentication", async () => {
			const mockResult = {
				success: true,
				totalTests: 3,
				passedTests: 3,
				testResults: [
					{
						testCaseId: "test-1",
						passed: true,
						input: { nums: [1, 2, 3] },
						expectedOutput: 6,
						actualOutput: 6,
						executionTime: 150,
					},
				],
				overallExecutionTime: 450,
				submissionId: "submission-1",
			};

			mockCodeService.submitCodeSolution.mockResolvedValue(mockResult);

			req.body = {
				problemId: "problem-1",
				userCode:
					"function solution(nums) { return nums.reduce((a, b) => a + b, 0); }",
				language: "javascript",
			};
			req.userId = "user-1";

			await CodeController.submitSolution(req as AuthRequest, res, next);

			expect(mockCodeService.submitCodeSolution).toHaveBeenCalledWith({
				problemId: "problem-1",
				userCode:
					"function solution(nums) { return nums.reduce((a, b) => a + b, 0); }",
				language: "javascript",
				userId: "user-1",
			});
			expect(ResponseObject.success).toHaveBeenCalledWith(
				200,
				"Solution submitted successfully",
				mockResult
			);
		});

		it("should handle submission with failed tests", async () => {
			const mockResult = {
				success: false,
				totalTests: 3,
				passedTests: 1,
				testResults: [
					{
						testCaseId: "test-1",
						passed: true,
						input: { nums: [1, 2, 3] },
						expectedOutput: 6,
						actualOutput: 6,
						executionTime: 150,
					},
					{
						testCaseId: "test-2",
						passed: false,
						input: { nums: [4, 5] },
						expectedOutput: 9,
						actualOutput: 10,
						executionTime: 120,
					},
				],
				overallExecutionTime: 350,
				submissionId: "submission-2",
			};

			mockCodeService.submitCodeSolution.mockResolvedValue(mockResult);

			req.body = {
				problemId: "problem-1",
				userCode: "function solution(nums) { return nums[0] + nums[1] + 1; }",
				language: "javascript",
			};
			req.userId = "user-1";

			await CodeController.submitSolution(req as AuthRequest, res, next);

			expect(mockCodeService.submitCodeSolution).toHaveBeenCalled();
			expect(ResponseObject.success).toHaveBeenCalledWith(
				200,
				"Solution submitted successfully",
				mockResult
			);
		});

		it("should handle missing authentication token", async () => {
			// req.userId will be undefined, simulating missing authentication
			req.userId = undefined;

			req.body = {
				problemId: "problem-1",
				userCode: "function solution() {}",
				language: "javascript",
			};

			await CodeController.submitSolution(req as AuthRequest, res, next);

			expect(next).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 401,
					message: "User not authenticated",
				})
			);
		});

		it("should handle validation errors", async () => {
			req.body = {
				problemId: "",
				userCode: "",
				language: "invalid",
			};
			req.userId = "user-1";

			await CodeController.submitSolution(req as AuthRequest, res, next);

			expect(next).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 400,
					message: "Validation error",
				})
			);
		});

		it("should handle service errors", async () => {
			const error = new Error("Failed to submit solution");
			mockCodeService.submitCodeSolution.mockRejectedValue(error);

			req.body = {
				problemId: "problem-1",
				userCode: "function solution() {}",
				language: "javascript",
			};
			req.userId = "user-1";

			await CodeController.submitSolution(req as AuthRequest, res, next);

			expect(next).toHaveBeenCalledWith(error);
		});

		it("should support Python language", async () => {
			const mockResult = {
				success: true,
				totalTests: 2,
				passedTests: 2,
				testResults: [],
				overallExecutionTime: 300,
				submissionId: "submission-3",
			};

			mockCodeService.submitCodeSolution.mockResolvedValue(mockResult);

			req.body = {
				problemId: "problem-2",
				userCode: "def solution(nums):\n    return sum(nums)",
				language: "python",
			};
			req.userId = "user-1";

			await CodeController.submitSolution(req as AuthRequest, res, next);

			expect(mockCodeService.submitCodeSolution).toHaveBeenCalledWith({
				problemId: "problem-2",
				userCode: "def solution(nums):\n    return sum(nums)",
				language: "python",
				userId: "user-1",
			});
		});
	});
});
