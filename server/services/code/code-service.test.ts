import { CodeService } from "./code-service";
import { CodeRepository } from "../../repositories/code/code-respositories";
import { CodePreparationService } from "./code-preparation-service";
import { CodeExecutionValidationService } from "./code-execution-validation-service";
import { UserRepository } from "../../repositories/login/login-repositories";
import { HttpError } from "../../types/common/error-types";
import { createMockUser } from "../../__tests__/utils/test-helpers";

jest.mock("../../repositories/code/code-respositories");
jest.mock("./code-preparation-service");
jest.mock("./code-execution-validation-service");
jest.mock("../../repositories/login/login-repositories");

describe("CodeService", () => {
	let codeService: CodeService;
	let mockCodeRepository: jest.Mocked<CodeRepository>;
	let mockCodePreparationService: jest.Mocked<CodePreparationService>;
	let mockCodeExecutionService: jest.Mocked<CodeExecutionValidationService>;
	let mockUserRepository: jest.Mocked<UserRepository>;

	beforeEach(() => {
		mockCodeRepository = {
			getProblem: jest.fn(),
			getTestCase: jest.fn(),
			getAllTestCases: jest.fn(),
			updateUserSubmission: jest.fn(),
		} as any;

		mockCodePreparationService = {
			prepareCodeForExecution: jest.fn(),
			getSingleTestCase: jest.fn(),
			getAllTestCases: jest.fn(),
		} as any;

		mockCodeExecutionService = {
			validateAndExecuteCode: jest.fn(),
		} as any;

		mockUserRepository = {
			getUser: jest.fn(),
			updateUser: jest.fn(),
			checkIfUserExists: jest.fn(),
			checkUserExistence: jest.fn(),
			saveUser: jest.fn(),
		} as any;

		(CodeRepository as jest.MockedClass<typeof CodeRepository>).mockImplementation(
			() => mockCodeRepository
		);
		(CodePreparationService as jest.MockedClass<typeof CodePreparationService>).mockImplementation(
			() => mockCodePreparationService
		);
		(CodeExecutionValidationService as jest.MockedClass<typeof CodeExecutionValidationService>).mockImplementation(
			() => mockCodeExecutionService
		);
		(UserRepository as jest.MockedClass<typeof UserRepository>).mockImplementation(
			() => mockUserRepository
		);

		codeService = new CodeService();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe("runSingleTestCase", () => {
		it("should run a single test case successfully", async () => {
			const mockPreparedData = {
				problem: {
					id: "problem-1",
					title: "Two Sum",
					rewardCredits: 10,
				},
				testCase: {
					id: "test-1",
					input: { nums: [1, 2, 3] },
					expectedOutput: 6,
					timeLimit: 1000,
				},
				allTestCases: [],
				preparedCode: "function solution() {}",
				language: "javascript",
				originalCode: "function solution() {}",
				problemId: "problem-1",
			};

			const mockExecutionResult = {
				success: true,
				output: JSON.stringify({
					success: true,
					output: 6,
					expected: 6,
					passed: true,
				}),
				executionTime: 150,
				securityPassed: true,
			};

			mockCodePreparationService.prepareCodeForExecution.mockResolvedValue(
				mockPreparedData as any
			);
			mockCodeExecutionService.validateAndExecuteCode.mockResolvedValue(
				mockExecutionResult
			);

			const result = await codeService.runSingleTestCase({
				problemId: "problem-1",
				userCode: "function solution(nums) { return nums.reduce((a,b) => a+b, 0); }",
				language: "javascript",
			});

			expect(result.passed).toBe(true);
			expect(result.testCaseId).toBe("test-1");
			expect(result.actualOutput).toBe(6);
			expect(result.executionTime).toBe(150);
		});

		it("should handle failed test case", async () => {
			const mockPreparedData = {
				problem: { id: "problem-1" },
				testCase: {
					id: "test-1",
					input: { nums: [1, 2, 3] },
					expectedOutput: 6,
					timeLimit: 1000,
				},
				allTestCases: [],
				preparedCode: "function solution() {}",
				language: "javascript",
				originalCode: "function solution() {}",
				problemId: "problem-1",
			};

			const mockExecutionResult = {
				success: true,
				output: JSON.stringify({
					success: true,
					output: 5,
					expected: 6,
					passed: false,
				}),
				executionTime: 120,
				securityPassed: true,
			};

			mockCodePreparationService.prepareCodeForExecution.mockResolvedValue(
				mockPreparedData as any
			);
			mockCodeExecutionService.validateAndExecuteCode.mockResolvedValue(
				mockExecutionResult
			);

			const result = await codeService.runSingleTestCase({
				problemId: "problem-1",
				userCode: "function solution(nums) { return 5; }",
				language: "javascript",
			});

			expect(result.passed).toBe(false);
			expect(result.actualOutput).toBe(5);
		});

		it("should handle execution errors", async () => {
			const mockPreparedData = {
				problem: { id: "problem-1" },
				testCase: {
					id: "test-1",
					input: { nums: [1, 2, 3] },
					expectedOutput: 6,
					timeLimit: 1000,
				},
				allTestCases: [],
				preparedCode: "function solution() {}",
				language: "javascript",
				originalCode: "function solution() {}",
				problemId: "problem-1",
			};

			const mockExecutionResult = {
				success: false,
				error: "ReferenceError: nums is not defined",
				executionTime: 50,
				securityPassed: true,
			};

			mockCodePreparationService.prepareCodeForExecution.mockResolvedValue(
				mockPreparedData as any
			);
			mockCodeExecutionService.validateAndExecuteCode.mockResolvedValue(
				mockExecutionResult
			);

			const result = await codeService.runSingleTestCase({
				problemId: "problem-1",
				userCode: "function solution() { return nums; }",
				language: "javascript",
			});

			expect(result.passed).toBe(false);
			expect(result.error).toBeDefined();
		});

		it("should throw HttpError when preparation fails", async () => {
			mockCodePreparationService.prepareCodeForExecution.mockRejectedValue(
				new HttpError(404, "Problem not found")
			);

			await expect(
				codeService.runSingleTestCase({
					problemId: "invalid-id",
					userCode: "function solution() {}",
					language: "javascript",
				})
			).rejects.toThrow(HttpError);
		});
	});

	describe("runAllTestCases", () => {
		it("should run all test cases successfully", async () => {
			const mockPreparedData = {
				problem: { id: "problem-1" },
				testCase: {
					id: "test-1",
					input: { nums: [1, 2, 3] },
					expectedOutput: 6,
					timeLimit: 1000,
				},
				allTestCases: [
					{
						id: "test-1",
						input: { nums: [1, 2, 3] },
						expectedOutput: 6,
						timeLimit: 1000,
					},
					{
						id: "test-2",
						input: { nums: [4, 5] },
						expectedOutput: 9,
						timeLimit: 1000,
					},
				],
				preparedCode: "function solution() {}",
				language: "javascript",
				originalCode: "function solution() {}",
				problemId: "problem-1",
			};

			mockCodePreparationService.prepareCodeForExecution.mockResolvedValue(
				mockPreparedData as any
			);

			mockCodeExecutionService.validateAndExecuteCode
				.mockResolvedValueOnce({
					success: true,
					output: JSON.stringify({
						success: true,
						output: 6,
						expected: 6,
						passed: true,
					}),
					executionTime: 150,
					securityPassed: true,
				})
				.mockResolvedValueOnce({
					success: true,
					output: JSON.stringify({
						success: true,
						output: 9,
						expected: 9,
						passed: true,
					}),
					executionTime: 120,
					securityPassed: true,
				});

			const result = await codeService.runAllTestCases({
				problemId: "problem-1",
				userCode: "function solution(nums) { return nums.reduce((a,b) => a+b, 0); }",
				language: "javascript",
			});

			expect(result.success).toBe(true);
			expect(result.totalTests).toBe(2);
			expect(result.passedTests).toBe(2);
			expect(result.testResults).toHaveLength(2);
		});

		it("should handle partial test case failures", async () => {
			const mockPreparedData = {
				problem: { id: "problem-1" },
				testCase: { id: "test-1" },
				allTestCases: [
					{
						id: "test-1",
						input: { nums: [1, 2, 3] },
						expectedOutput: 6,
						timeLimit: 1000,
					},
					{
						id: "test-2",
						input: { nums: [] },
						expectedOutput: 0,
						timeLimit: 1000,
					},
				],
				preparedCode: "function solution() {}",
				language: "javascript",
				originalCode: "function solution() {}",
				problemId: "problem-1",
			};

			mockCodePreparationService.prepareCodeForExecution.mockResolvedValue(
				mockPreparedData as any
			);

			mockCodeExecutionService.validateAndExecuteCode
				.mockResolvedValueOnce({
					success: true,
					output: JSON.stringify({
						success: true,
						output: 6,
						expected: 6,
						passed: true,
					}),
					executionTime: 150,
					securityPassed: true,
				})
				.mockResolvedValueOnce({
					success: false,
					error: "TypeError: Cannot read property",
					executionTime: 50,
					securityPassed: true,
				});

			const result = await codeService.runAllTestCases({
				problemId: "problem-1",
				userCode: "function solution(nums) { return nums[0] + nums[1]; }",
				language: "javascript",
			});

			expect(result.success).toBe(false);
			expect(result.totalTests).toBe(2);
			expect(result.passedTests).toBe(1);
		});

		it("should handle test case execution errors gracefully", async () => {
			const mockPreparedData = {
				problem: { id: "problem-1" },
				testCase: { id: "test-1" },
				allTestCases: [
					{
						id: "test-1",
						input: { nums: [1, 2] },
						expectedOutput: 3,
						timeLimit: 1000,
					},
				],
				preparedCode: "function solution() {}",
				language: "javascript",
				originalCode: "function solution() {}",
				problemId: "problem-1",
			};

			mockCodePreparationService.prepareCodeForExecution.mockResolvedValue(
				mockPreparedData as any
			);

			mockCodeExecutionService.validateAndExecuteCode.mockRejectedValue(
				new Error("Execution timeout")
			);

			const result = await codeService.runAllTestCases({
				problemId: "problem-1",
				userCode: "function solution() { while(true) {} }",
				language: "javascript",
			});

			expect(result.success).toBe(false);
			expect(result.passedTests).toBe(0);
			expect(result.testResults[0].error).toContain("Execution timeout");
		});
	});

	describe("submitCodeSolution", () => {
		it("should submit solution successfully and update user credits", async () => {
			const mockUser = createMockUser({ credits: 100, pointsScored: 50 });
			const mockSubmission = {
				id: "submission-1",
				userId: "user-1",
				problemId: "problem-1",
				code: "function solution() {}",
				language: "javascript",
				status: "accepted" as const,
				creditsEarned: 10,
				score: 100,
				testCasesPassed: 3,
				totalTestCases: 3,
				executionTime: 450,
				memoryUsed: 0,
				errorMessage: null,
				submittedAt: new Date(),
			};

			const mockPreparedData = {
				problem: { id: "problem-1" },
				testCase: { id: "test-1" },
				allTestCases: [
					{
						id: "test-1",
						input: { nums: [1, 2] },
						expectedOutput: 3,
						timeLimit: 1000,
					},
				],
				preparedCode: "function solution() {}",
				language: "javascript",
				originalCode: "function solution() {}",
				problemId: "problem-1",
			};

			mockCodePreparationService.prepareCodeForExecution.mockResolvedValue(
				mockPreparedData as any
			);

			mockCodeExecutionService.validateAndExecuteCode.mockResolvedValue({
				success: true,
				output: JSON.stringify({
					success: true,
					output: 3,
					expected: 3,
					passed: true,
				}),
				executionTime: 150,
				securityPassed: true,
			});

			mockUserRepository.getUser.mockResolvedValue(mockUser);
			mockCodeRepository.updateUserSubmission.mockResolvedValue(mockSubmission as any);
			mockUserRepository.updateUser.mockResolvedValue(mockUser);

			const result = await codeService.submitCodeSolution({
				problemId: "problem-1",
				userCode: "function solution(nums) { return nums[0] + nums[1]; }",
				language: "javascript",
				userId: "user-1",
			});

			expect(result.success).toBe(true);
			expect(result.submissionId).toBe("submission-1");
			expect(mockUserRepository.updateUser).toHaveBeenCalledWith({
				id: "user-1",
				credits: 110,
				pointsScored: 150,
			});
		});

		it("should submit solution without updating credits when tests fail", async () => {
			const mockUser = createMockUser({ credits: 100, pointsScored: 50 });
			const mockSubmission = {
				id: "submission-2",
				userId: "user-1",
				problemId: "problem-1",
				code: "function solution() {}",
				language: "javascript",
				status: "wrong_answer" as const,
				creditsEarned: 0,
				score: 50,
				testCasesPassed: 1,
				totalTestCases: 2,
				executionTime: 200,
				memoryUsed: 0,
				errorMessage: null,
				submittedAt: new Date(),
			};

			const mockPreparedData = {
				problem: { id: "problem-1" },
				testCase: { id: "test-1" },
				allTestCases: [
					{
						id: "test-1",
						input: { nums: [1, 2] },
						expectedOutput: 3,
						timeLimit: 1000,
					},
					{
						id: "test-2",
						input: { nums: [3, 4] },
						expectedOutput: 7,
						timeLimit: 1000,
					},
				],
				preparedCode: "function solution() {}",
				language: "javascript",
				originalCode: "function solution() {}",
				problemId: "problem-1",
			};

			mockCodePreparationService.prepareCodeForExecution.mockResolvedValue(
				mockPreparedData as any
			);

			mockCodeExecutionService.validateAndExecuteCode
				.mockResolvedValueOnce({
					success: true,
					output: JSON.stringify({
						success: true,
						output: 3,
						expected: 3,
						passed: true,
					}),
					executionTime: 100,
					securityPassed: true,
				})
				.mockResolvedValueOnce({
					success: true,
					output: JSON.stringify({
						success: true,
						output: 8,
						expected: 7,
						passed: false,
					}),
					executionTime: 100,
					securityPassed: true,
				});

			mockUserRepository.getUser.mockResolvedValue(mockUser);
			mockCodeRepository.updateUserSubmission.mockResolvedValue(mockSubmission as any);

			const result = await codeService.submitCodeSolution({
				problemId: "problem-1",
				userCode: "function solution(nums) { return nums[0] + nums[1] + 1; }",
				language: "javascript",
				userId: "user-1",
			});

			expect(result.success).toBe(false);
			expect(result.submissionId).toBe("submission-2");
			expect(mockUserRepository.updateUser).not.toHaveBeenCalled();
		});

		it("should submit solution without userId (guest mode)", async () => {
			const mockPreparedData = {
				problem: { id: "problem-1" },
				testCase: { id: "test-1" },
				allTestCases: [
					{
						id: "test-1",
						input: { nums: [1, 2] },
						expectedOutput: 3,
						timeLimit: 1000,
					},
				],
				preparedCode: "function solution() {}",
				language: "javascript",
				originalCode: "function solution() {}",
				problemId: "problem-1",
			};

			mockCodePreparationService.prepareCodeForExecution.mockResolvedValue(
				mockPreparedData as any
			);

			mockCodeExecutionService.validateAndExecuteCode.mockResolvedValue({
				success: true,
				output: JSON.stringify({
					success: true,
					output: 3,
					expected: 3,
					passed: true,
				}),
				executionTime: 150,
				securityPassed: true,
			});

			const result = await codeService.submitCodeSolution({
				problemId: "problem-1",
				userCode: "function solution(nums) { return nums[0] + nums[1]; }",
				language: "javascript",
			});

			expect(result.success).toBe(true);
			expect(result.submissionId).toBeUndefined();
			expect(mockUserRepository.getUser).not.toHaveBeenCalled();
			expect(mockCodeRepository.updateUserSubmission).not.toHaveBeenCalled();
		});

		it("should throw error when user not found", async () => {
			const mockPreparedData = {
				problem: { id: "problem-1" },
				testCase: { id: "test-1" },
				allTestCases: [
					{
						id: "test-1",
						input: { nums: [1, 2] },
						expectedOutput: 3,
						timeLimit: 1000,
					},
				],
				preparedCode: "function solution() {}",
				language: "javascript",
				originalCode: "function solution() {}",
				problemId: "problem-1",
			};

			mockCodePreparationService.prepareCodeForExecution.mockResolvedValue(
				mockPreparedData as any
			);

			mockCodeExecutionService.validateAndExecuteCode.mockResolvedValue({
				success: true,
				output: JSON.stringify({
					success: true,
					output: 3,
					expected: 3,
					passed: true,
				}),
				executionTime: 150,
				securityPassed: true,
			});

			mockUserRepository.getUser.mockResolvedValue(null);

			await expect(
				codeService.submitCodeSolution({
					problemId: "problem-1",
					userCode: "function solution() {}",
					language: "javascript",
					userId: "invalid-user",
				})
			).rejects.toThrow(HttpError);
		});

		it("should support Python language", async () => {
			const mockUser = createMockUser({ credits: 100, pointsScored: 50 });
			const mockSubmission = {
				id: "submission-3",
				userId: "user-1",
				problemId: "problem-2",
				code: "def solution(nums):\n    return sum(nums)",
				language: "python",
				status: "accepted" as const,
				creditsEarned: 15,
				score: 100,
				testCasesPassed: 2,
				totalTestCases: 2,
				executionTime: 300,
				memoryUsed: 0,
				errorMessage: null,
				submittedAt: new Date(),
			};

			const mockPreparedData = {
				problem: { id: "problem-2" },
				testCase: { id: "test-1" },
				allTestCases: [
					{
						id: "test-1",
						input: { nums: [1, 2, 3] },
						expectedOutput: 6,
						timeLimit: 1000,
					},
				],
				preparedCode: "def solution() {}",
				language: "python",
				originalCode: "def solution() {}",
				problemId: "problem-2",
			};

			mockCodePreparationService.prepareCodeForExecution.mockResolvedValue(
				mockPreparedData as any
			);

			mockCodeExecutionService.validateAndExecuteCode.mockResolvedValue({
				success: true,
				output: JSON.stringify({
					success: true,
					output: 6,
					expected: 6,
					passed: true,
				}),
				executionTime: 300,
				securityPassed: true,
			});

			mockUserRepository.getUser.mockResolvedValue(mockUser);
			mockCodeRepository.updateUserSubmission.mockResolvedValue(mockSubmission as any);
			mockUserRepository.updateUser.mockResolvedValue(mockUser);

			const result = await codeService.submitCodeSolution({
				problemId: "problem-2",
				userCode: "def solution(nums):\n    return sum(nums)",
				language: "python",
				userId: "user-1",
			});

			expect(result.success).toBe(true);
			expect(mockCodeRepository.updateUserSubmission).toHaveBeenCalledWith(
				"user-1",
				"problem-2",
				"def solution(nums):\n    return sum(nums)",
				"python",
				expect.any(Object)
			);
		});
	});
});
