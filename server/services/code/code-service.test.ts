import { CodeService } from "./code-service";
import { CodeRepository } from "../../repositories/code/code-respositories";
import { CodePreparationService } from "./code-preparation-service";
import { Judge0Service } from "./judge0-service";
import { UserRepository } from "../../repositories/login/login-repositories";
import { HttpError } from "../../types/common/error-types";
import { createMockUser } from "../../__tests__/utils/test-helpers";

jest.mock("../../repositories/code/code-respositories");
jest.mock("./code-preparation-service");
jest.mock("./judge0-service");
jest.mock("../../repositories/login/login-repositories");

const testCase1 = {
	id: "test-1",
	problemId: "problem-1",
	input: { nums: [1, 2, 3] },
	expectedOutput: 6,
	timeLimit: 1000,
	memoryLimit: 256,
	isExample: true,
	isHidden: false,
};

const testCase2 = {
	id: "test-2",
	problemId: "problem-1",
	input: { nums: [4, 5] },
	expectedOutput: 9,
	timeLimit: 1000,
	memoryLimit: 256,
	isExample: false,
	isHidden: false,
};

function passedExecution(output: unknown, expected: unknown) {
	return {
		success: true,
		output: JSON.stringify({
			success: true,
			output,
			expected,
			passed: true,
		}),
		executionTime: 150,
	};
}

function failedExecution(output: unknown, expected: unknown) {
	return {
		success: true,
		output: JSON.stringify({
			success: true,
			output,
			expected,
			passed: false,
		}),
		executionTime: 120,
	};
}

function errorExecution(error: string) {
	return { success: false, error, executionTime: 50 };
}

describe("CodeService", () => {
	let codeService: CodeService;
	let mockCodeRepository: jest.Mocked<CodeRepository>;
	let mockPreparationService: jest.Mocked<CodePreparationService>;
	let mockJudge0: jest.Mocked<Judge0Service>;
	let mockUserRepository: jest.Mocked<UserRepository>;

	beforeEach(() => {
		mockCodeRepository = {
			getProblem: jest.fn(),
			getTestCase: jest.fn(),
			getAllTestCases: jest.fn(),
			updateUserSubmission: jest.fn(),
		} as any;

		mockPreparationService = {
			wrapCodeForTestCase: jest.fn().mockReturnValue("wrapped code"),
		} as any;

		mockJudge0 = {
			execute: jest.fn(),
		} as any;

		mockUserRepository = {
			getUser: jest.fn(),
			updateUser: jest.fn(),
		} as any;

		(CodeRepository as jest.MockedClass<typeof CodeRepository>).mockImplementation(
			() => mockCodeRepository
		);
		(CodePreparationService as jest.MockedClass<typeof CodePreparationService>).mockImplementation(
			() => mockPreparationService
		);
		(Judge0Service as jest.MockedClass<typeof Judge0Service>).mockImplementation(
			() => mockJudge0
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
			mockCodeRepository.getTestCase.mockResolvedValue(testCase1 as any);
			mockJudge0.execute.mockResolvedValue(passedExecution(6, 6));

			const result = await codeService.runSingleTestCase({
				problemId: "problem-1",
				userCode: "function solution(nums) { return nums.reduce((a,b) => a+b, 0); }",
				language: "javascript",
			});

			expect(result.passed).toBe(true);
			expect(result.testCaseId).toBe("test-1");
			expect(result.actualOutput).toBe(6);
			expect(result.executionTime).toBe(150);
			expect(mockPreparationService.wrapCodeForTestCase).toHaveBeenCalledWith(
				expect.any(String),
				testCase1,
				"javascript"
			);
		});

		it("should handle failed test case", async () => {
			mockCodeRepository.getTestCase.mockResolvedValue(testCase1 as any);
			mockJudge0.execute.mockResolvedValue(failedExecution(5, 6));

			const result = await codeService.runSingleTestCase({
				problemId: "problem-1",
				userCode: "function solution(nums) { return 5; }",
				language: "javascript",
			});

			expect(result.passed).toBe(false);
			expect(result.actualOutput).toBe(5);
		});

		it("should handle execution errors", async () => {
			mockCodeRepository.getTestCase.mockResolvedValue(testCase1 as any);
			mockJudge0.execute.mockResolvedValue(
				errorExecution("ReferenceError: nums is not defined")
			);

			const result = await codeService.runSingleTestCase({
				problemId: "problem-1",
				userCode: "function solution() { return nums; }",
				language: "javascript",
			});

			expect(result.passed).toBe(false);
			expect(result.error).toBeDefined();
		});

		it("should throw HttpError when test case not found", async () => {
			mockCodeRepository.getTestCase.mockResolvedValue(null);

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
			mockCodeRepository.getAllTestCases.mockResolvedValue([
				testCase1,
				testCase2,
			] as any);
			mockJudge0.execute
				.mockResolvedValueOnce(passedExecution(6, 6))
				.mockResolvedValueOnce(passedExecution(9, 9));

			const result = await codeService.runAllTestCases({
				problemId: "problem-1",
				userCode: "function solution(nums) { return nums.reduce((a,b) => a+b, 0); }",
				language: "javascript",
			});

			expect(result.success).toBe(true);
			expect(result.totalTests).toBe(2);
			expect(result.passedTests).toBe(2);
			expect(result.testResults).toHaveLength(2);
			expect(mockPreparationService.wrapCodeForTestCase).toHaveBeenCalledTimes(2);
		});

		it("should handle partial test case failures", async () => {
			mockCodeRepository.getAllTestCases.mockResolvedValue([
				testCase1,
				testCase2,
			] as any);
			mockJudge0.execute
				.mockResolvedValueOnce(passedExecution(6, 6))
				.mockResolvedValueOnce(
					errorExecution("TypeError: Cannot read property")
				);

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
			mockCodeRepository.getAllTestCases.mockResolvedValue([
				testCase1,
			] as any);
			mockJudge0.execute.mockRejectedValue(new Error("Execution timeout"));

			const result = await codeService.runAllTestCases({
				problemId: "problem-1",
				userCode: "function solution() { while(true) {} }",
				language: "javascript",
			});

			expect(result.success).toBe(false);
			expect(result.passedTests).toBe(0);
			expect(result.testResults[0].error).toContain("Execution timeout");
		});

		it("should throw when no test cases exist", async () => {
			mockCodeRepository.getAllTestCases.mockResolvedValue([]);

			await expect(
				codeService.runAllTestCases({
					problemId: "problem-1",
					userCode: "function solution() {}",
					language: "javascript",
				})
			).rejects.toThrow(HttpError);
		});
	});

	describe("submitCodeSolution", () => {
		it("should submit solution successfully and update user credits", async () => {
			const mockUser = createMockUser({ credits: 100, pointsScored: 50 });
			const mockSubmission = {
				id: "submission-1",
				creditsEarned: 10,
				score: 100,
			};

			mockCodeRepository.getAllTestCases.mockResolvedValue([
				testCase1,
			] as any);
			mockJudge0.execute.mockResolvedValue(passedExecution(3, 3));
			mockUserRepository.getUser.mockResolvedValue(mockUser);
			mockCodeRepository.updateUserSubmission.mockResolvedValue(
				mockSubmission as any
			);
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

		it("should not update credits when tests fail", async () => {
			const mockUser = createMockUser({ credits: 100, pointsScored: 50 });
			const mockSubmission = {
				id: "submission-2",
				creditsEarned: 0,
				score: 50,
			};

			mockCodeRepository.getAllTestCases.mockResolvedValue([
				testCase1,
				testCase2,
			] as any);
			mockJudge0.execute
				.mockResolvedValueOnce(passedExecution(6, 6))
				.mockResolvedValueOnce(failedExecution(8, 9));
			mockUserRepository.getUser.mockResolvedValue(mockUser);
			mockCodeRepository.updateUserSubmission.mockResolvedValue(
				mockSubmission as any
			);

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

		it("should skip DB submission without userId (guest mode)", async () => {
			mockCodeRepository.getAllTestCases.mockResolvedValue([
				testCase1,
			] as any);
			mockJudge0.execute.mockResolvedValue(passedExecution(6, 6));

			const result = await codeService.submitCodeSolution({
				problemId: "problem-1",
				userCode: "function solution(nums) { return nums.reduce((a,b) => a+b, 0); }",
				language: "javascript",
			});

			expect(result.success).toBe(true);
			expect(result.submissionId).toBeUndefined();
			expect(mockUserRepository.getUser).not.toHaveBeenCalled();
			expect(mockCodeRepository.updateUserSubmission).not.toHaveBeenCalled();
		});

		it("should throw error when user not found", async () => {
			mockCodeRepository.getAllTestCases.mockResolvedValue([
				testCase1,
			] as any);
			mockJudge0.execute.mockResolvedValue(passedExecution(6, 6));
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
				creditsEarned: 15,
				score: 100,
			};

			mockCodeRepository.getAllTestCases.mockResolvedValue([
				testCase1,
			] as any);
			mockJudge0.execute.mockResolvedValue(passedExecution(6, 6));
			mockUserRepository.getUser.mockResolvedValue(mockUser);
			mockCodeRepository.updateUserSubmission.mockResolvedValue(
				mockSubmission as any
			);
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
