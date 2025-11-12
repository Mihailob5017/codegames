import { CodeRepository } from "./code-respositories";
import { PrismaServiceInstance } from "../../config/prisma-config";
import { SubmissionStatus } from "../../generated/prisma";

jest.mock("../../config/prisma-config");

describe("CodeRepository", () => {
	let codeRepository: CodeRepository;
	let mockPrismaClient: any;

	beforeEach(() => {
		mockPrismaClient = {
			problem: {
				findUnique: jest.fn(),
				findMany: jest.fn(),
			},
			testCase: {
				findFirst: jest.fn(),
				findMany: jest.fn(),
			},
			submission: {
				findFirst: jest.fn(),
				create: jest.fn(),
				update: jest.fn(),
			},
		};

		(PrismaServiceInstance.getClient as jest.Mock) = jest.fn(
			() => mockPrismaClient
		);

		codeRepository = new CodeRepository();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe("getProblem", () => {
		it("should retrieve a problem successfully", async () => {
			const mockProblem = {
				id: "problem-1",
				title: "Two Sum",
				description: "Find two numbers that add up to target",
				hints: [],
				explanation: "Use a hash map",
				examples: [],
				difficulty: "easy",
				type: "array_and_string",
				accessLevel: "free",
				unlockCost: 0,
				rewardCredits: 10,
				searchTokens: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockPrismaClient.problem.findUnique.mockResolvedValue(mockProblem);

			const result = await codeRepository.getProblem("problem-1");

			expect(result).toEqual(mockProblem);
			expect(mockPrismaClient.problem.findUnique).toHaveBeenCalledWith({
				where: { id: "problem-1" },
			});
		});

		it("should return null when problem not found", async () => {
			mockPrismaClient.problem.findUnique.mockResolvedValue(null);

			const result = await codeRepository.getProblem("invalid-id");

			expect(result).toBeNull();
		});

		it("should throw error on database failure", async () => {
			mockPrismaClient.problem.findUnique.mockRejectedValue(
				new Error("Database error")
			);

			await expect(codeRepository.getProblem("problem-1")).rejects.toThrow(
				"Failed to get problem"
			);
		});
	});

	describe("getTestCase", () => {
		it("should retrieve an example test case successfully", async () => {
			const mockTestCase = {
				id: "test-1",
				problemId: "problem-1",
				input: { nums: [2, 7, 11, 15], target: 9 },
				expectedOutput: [0, 1],
				isExample: true,
				isHidden: false,
				timeLimit: 1000,
				memoryLimit: 256,
			};

			mockPrismaClient.testCase.findFirst.mockResolvedValue(mockTestCase);

			const result = await codeRepository.getTestCase("problem-1");

			expect(result).toEqual(mockTestCase);
			expect(mockPrismaClient.testCase.findFirst).toHaveBeenCalledWith({
				where: { problemId: "problem-1", isExample: true },
			});
		});

		it("should return null when no example test case found", async () => {
			mockPrismaClient.testCase.findFirst.mockResolvedValue(null);

			const result = await codeRepository.getTestCase("problem-1");

			expect(result).toBeNull();
		});

		it("should throw error on database failure", async () => {
			mockPrismaClient.testCase.findFirst.mockRejectedValue(
				new Error("Database error")
			);

			await expect(codeRepository.getTestCase("problem-1")).rejects.toThrow(
				"Failed to get testcase"
			);
		});
	});

	describe("getAllTestCases", () => {
		it("should retrieve all test cases successfully", async () => {
			const mockTestCases = [
				{
					id: "test-1",
					problemId: "problem-1",
					input: { nums: [2, 7], target: 9 },
					expectedOutput: [0, 1],
					isExample: true,
					isHidden: false,
					timeLimit: 1000,
					memoryLimit: 256,
				},
				{
					id: "test-2",
					problemId: "problem-1",
					input: { nums: [3, 4], target: 7 },
					expectedOutput: [0, 1],
					isExample: false,
					isHidden: true,
					timeLimit: 1000,
					memoryLimit: 256,
				},
			];

			mockPrismaClient.testCase.findMany.mockResolvedValue(mockTestCases);

			const result = await codeRepository.getAllTestCases("problem-1");

			expect(result).toEqual(mockTestCases);
			expect(mockPrismaClient.testCase.findMany).toHaveBeenCalledWith({
				where: { problemId: "problem-1" },
			});
		});

		it("should return empty array when no test cases found", async () => {
			mockPrismaClient.testCase.findMany.mockResolvedValue([]);

			const result = await codeRepository.getAllTestCases("problem-1");

			expect(result).toEqual([]);
		});

		it("should throw error on database failure", async () => {
			mockPrismaClient.testCase.findMany.mockRejectedValue(
				new Error("Database error")
			);

			await expect(
				codeRepository.getAllTestCases("problem-1")
			).rejects.toThrow("Failed to get testcase");
		});
	});

	describe("updateUserSubmission", () => {
		const mockProblem = {
			id: "problem-1",
			title: "Two Sum",
			rewardCredits: 10,
		};

		const mockResult = {
			success: true,
			totalTests: 3,
			passedTests: 3,
			testResults: [
				{
					testCaseId: "test-1",
					passed: true,
					input: { nums: [2, 7] },
					expectedOutput: [0, 1],
					actualOutput: [0, 1],
					executionTime: 150,
				},
			],
			overallExecutionTime: 450,
		};

		it("should create new submission when none exists", async () => {
			const mockSubmission = {
				id: "submission-1",
				userId: "user-1",
				problemId: "problem-1",
				code: "function solution() {}",
				language: "javascript",
				status: SubmissionStatus.accepted,
				executionTime: 450,
				memoryUsed: 0,
				score: 100,
				testCasesPassed: 3,
				totalTestCases: 3,
				errorMessage: null,
				creditsEarned: 10,
				submittedAt: new Date(),
			};

			mockPrismaClient.problem.findUnique.mockResolvedValue(mockProblem);
			mockPrismaClient.submission.findFirst.mockResolvedValue(null);
			mockPrismaClient.submission.create.mockResolvedValue(mockSubmission);

			const result = await codeRepository.updateUserSubmission(
				"user-1",
				"problem-1",
				"function solution() {}",
				"javascript",
				mockResult
			);

			expect(result).toEqual(mockSubmission);
			expect(mockPrismaClient.submission.create).toHaveBeenCalledWith({
				data: {
					userId: "user-1",
					problemId: "problem-1",
					code: "function solution() {}",
					language: "javascript",
					status: SubmissionStatus.accepted,
					executionTime: 450,
					memoryUsed: 0,
					score: 100,
					testCasesPassed: 3,
					totalTestCases: 3,
					errorMessage: null,
					creditsEarned: 10,
				},
			});
		});

		it("should update existing submission when new score is better", async () => {
			const existingSubmission = {
				id: "submission-1",
				score: 50,
			};

			const updatedSubmission = {
				id: "submission-1",
				userId: "user-1",
				problemId: "problem-1",
				code: "function solution() {}",
				language: "javascript",
				status: SubmissionStatus.accepted,
				executionTime: 450,
				memoryUsed: 0,
				score: 100,
				testCasesPassed: 3,
				totalTestCases: 3,
				errorMessage: null,
				creditsEarned: 10,
				submittedAt: new Date(),
			};

			mockPrismaClient.problem.findUnique.mockResolvedValue(mockProblem);
			mockPrismaClient.submission.findFirst.mockResolvedValue(
				existingSubmission
			);
			mockPrismaClient.submission.update.mockResolvedValue(updatedSubmission);

			const result = await codeRepository.updateUserSubmission(
				"user-1",
				"problem-1",
				"function solution() {}",
				"javascript",
				mockResult
			);

			expect(result).toEqual(updatedSubmission);
			expect(mockPrismaClient.submission.update).toHaveBeenCalledWith({
				where: { id: "submission-1" },
				data: expect.objectContaining({
					score: 100,
					status: SubmissionStatus.accepted,
				}),
			});
		});

		it("should not update existing submission when new score is worse", async () => {
			const existingSubmission = {
				id: "submission-1",
				score: 100,
			};

			const mockPartialResult = {
				success: false,
				totalTests: 3,
				passedTests: 1,
				testResults: [],
				overallExecutionTime: 200,
			};

			mockPrismaClient.problem.findUnique.mockResolvedValue(mockProblem);
			mockPrismaClient.submission.findFirst.mockResolvedValue(
				existingSubmission
			);

			const result = await codeRepository.updateUserSubmission(
				"user-1",
				"problem-1",
				"function solution() {}",
				"javascript",
				mockPartialResult
			);

			expect(result).toEqual(existingSubmission);
			expect(mockPrismaClient.submission.update).not.toHaveBeenCalled();
		});

		it("should calculate correct status for failed submission", async () => {
			const mockFailedResult = {
				success: false,
				totalTests: 3,
				passedTests: 1,
				testResults: [
					{
						testCaseId: "test-1",
						passed: false,
						input: {},
						expectedOutput: 5,
						actualOutput: 3,
						executionTime: 100,
					},
				],
				overallExecutionTime: 300,
			};

			mockPrismaClient.problem.findUnique.mockResolvedValue(mockProblem);
			mockPrismaClient.submission.findFirst.mockResolvedValue(null);
			mockPrismaClient.submission.create.mockResolvedValue({});

			await codeRepository.updateUserSubmission(
				"user-1",
				"problem-1",
				"function solution() {}",
				"javascript",
				mockFailedResult
			);

			expect(mockPrismaClient.submission.create).toHaveBeenCalledWith({
				data: expect.objectContaining({
					status: SubmissionStatus.wrong_answer,
					creditsEarned: 0,
					score: 33, // 1/3 * 100
				}),
			});
		});

		it("should set runtime_error status when there are errors", async () => {
			const mockErrorResult = {
				success: false,
				totalTests: 2,
				passedTests: 1,
				testResults: [
					{
						testCaseId: "test-1",
						passed: true,
						input: {},
						expectedOutput: 5,
						actualOutput: 5,
						executionTime: 100,
					},
					{
						testCaseId: "test-2",
						passed: false,
						input: {},
						expectedOutput: 10,
						actualOutput: undefined,
						executionTime: 50,
						error: "TypeError: Cannot read property",
					},
				],
				overallExecutionTime: 150,
			};

			mockPrismaClient.problem.findUnique.mockResolvedValue(mockProblem);
			mockPrismaClient.submission.findFirst.mockResolvedValue(null);
			mockPrismaClient.submission.create.mockResolvedValue({});

			await codeRepository.updateUserSubmission(
				"user-1",
				"problem-1",
				"function solution() {}",
				"javascript",
				mockErrorResult
			);

			expect(mockPrismaClient.submission.create).toHaveBeenCalledWith({
				data: expect.objectContaining({
					status: SubmissionStatus.runtime_error,
					errorMessage: "TypeError: Cannot read property",
				}),
			});
		});

		it("should throw error when problem not found", async () => {
			mockPrismaClient.problem.findUnique.mockResolvedValue(null);

			await expect(
				codeRepository.updateUserSubmission(
					"user-1",
					"invalid-problem",
					"function solution() {}",
					"javascript",
					mockResult
				)
			).rejects.toThrow("Problem with ID invalid-problem not found");
		});

		it("should support Python language", async () => {
			mockPrismaClient.problem.findUnique.mockResolvedValue(mockProblem);
			mockPrismaClient.submission.findFirst.mockResolvedValue(null);
			mockPrismaClient.submission.create.mockResolvedValue({});

			await codeRepository.updateUserSubmission(
				"user-1",
				"problem-1",
				"def solution():\n    pass",
				"python",
				mockResult
			);

			expect(mockPrismaClient.submission.create).toHaveBeenCalledWith({
				data: expect.objectContaining({
					language: "python",
					code: "def solution():\n    pass",
				}),
			});
		});

		it("should handle database errors gracefully", async () => {
			mockPrismaClient.problem.findUnique.mockResolvedValue(mockProblem);
			mockPrismaClient.submission.findFirst.mockRejectedValue(
				new Error("Database connection lost")
			);

			await expect(
				codeRepository.updateUserSubmission(
					"user-1",
					"problem-1",
					"function solution() {}",
					"javascript",
					mockResult
				)
			).rejects.toThrow("Failed to update user submission");
		});
	});
});
