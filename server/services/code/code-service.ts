import { CodeRepository } from "../../repositories/code/code-respositories";
import { CodePreparationService } from "./code-preparation-service";
import { Judge0Service, ExecutionResult } from "./judge0-service";
import { HttpError } from "../../types/common/error-types";
import { UserRepository } from "../../repositories/login/login-repositories";
import { TestCase } from "../../generated/prisma";

export type SupportedLanguage = "javascript" | "python";

export interface CodeSubmissionRequest {
	problemId: string;
	userCode: string;
	language: SupportedLanguage;
	userId?: string;
}

export interface TestCaseResult {
	testCaseId: string;
	passed: boolean;
	input: unknown;
	expectedOutput: unknown;
	actualOutput?: unknown;
	executionTime: number;
	error?: string;
}

export interface CodeSubmissionResult {
	success: boolean;
	totalTests: number;
	passedTests: number;
	testResults: TestCaseResult[];
	overallExecutionTime: number;
	submissionId?: string;
}

export class CodeService {
	private readonly preparationService: CodePreparationService;
	private readonly judge0: Judge0Service;
	private readonly codeRepository: CodeRepository;
	private readonly userRepository: UserRepository;

	constructor() {
		this.preparationService = new CodePreparationService();
		this.judge0 = new Judge0Service();
		this.codeRepository = new CodeRepository();
		this.userRepository = new UserRepository();
	}

	async runSingleTestCase(
		request: CodeSubmissionRequest
	): Promise<TestCaseResult> {
		const testCase = await this.getExampleTestCase(request.problemId);
		return this.executeTestCase(testCase, request.userCode, request.language);
	}

	async runAllTestCases(
		request: CodeSubmissionRequest
	): Promise<CodeSubmissionResult> {
		const startTime = Date.now();
		const testCases = await this.getAllTestCases(request.problemId);

		const testResults: TestCaseResult[] = [];
		for (const testCase of testCases) {
			try {
				const result = await this.executeTestCase(
					testCase,
					request.userCode,
					request.language
				);
				testResults.push(result);
			} catch (error) {
				testResults.push({
					testCaseId: testCase.id,
					passed: false,
					input: testCase.input,
					expectedOutput: testCase.expectedOutput,
					executionTime: 0,
					error:
						error instanceof Error
							? error.message
							: "Unknown error",
				});
			}
		}

		const passedTests = testResults.filter((r) => r.passed).length;
		return {
			success: passedTests === testCases.length,
			totalTests: testCases.length,
			passedTests,
			testResults,
			overallExecutionTime: Date.now() - startTime,
		};
	}

	async submitCodeSolution(
		request: CodeSubmissionRequest
	): Promise<CodeSubmissionResult> {
		const result = await this.runAllTestCases(request);

		if (request.userId) {
			await this.saveSubmission(request, result);
		}

		return result;
	}

	private async executeTestCase(
		testCase: TestCase,
		userCode: string,
		language: SupportedLanguage
	): Promise<TestCaseResult> {
		const wrappedCode = this.preparationService.wrapCodeForTestCase(
			userCode,
			testCase,
			language
		);

		const execution = await this.judge0.execute({
			code: wrappedCode,
			language,
			timeLimit: testCase.timeLimit,
		});

		return this.parseExecutionResult(testCase, execution);
	}

	private parseExecutionResult(
		testCase: TestCase,
		execution: ExecutionResult
	): TestCaseResult {
		if (!execution.success || !execution.output) {
			return {
				testCaseId: testCase.id,
				passed: false,
				input: testCase.input,
				expectedOutput: testCase.expectedOutput,
				executionTime: execution.executionTime,
				error: execution.error || "Execution failed",
			};
		}

		try {
			const parsed = JSON.parse(execution.output);
			return {
				testCaseId: testCase.id,
				passed: parsed.passed,
				input: testCase.input,
				expectedOutput: testCase.expectedOutput,
				actualOutput: parsed.output,
				executionTime: execution.executionTime,
				error: parsed.error,
			};
		} catch {
			return {
				testCaseId: testCase.id,
				passed: false,
				input: testCase.input,
				expectedOutput: testCase.expectedOutput,
				executionTime: execution.executionTime,
				error: "Failed to parse execution result",
			};
		}
	}

	private async getExampleTestCase(problemId: string): Promise<TestCase> {
		const testCase = await this.codeRepository.getTestCase(problemId);
		if (!testCase) {
			throw new HttpError(
				404,
				`Test case not found for problem ${problemId}`
			);
		}
		return testCase;
	}

	private async getAllTestCases(problemId: string): Promise<TestCase[]> {
		const testCases = await this.codeRepository.getAllTestCases(problemId);
		if (!testCases.length) {
			throw new HttpError(
				404,
				`No test cases found for problem ${problemId}`
			);
		}
		return testCases;
	}

	private async saveSubmission(
		request: CodeSubmissionRequest,
		result: CodeSubmissionResult
	): Promise<void> {
		const userId = request.userId!;

		const user = await this.userRepository.getUser(userId);
		if (!user) {
			throw new HttpError(404, "User not found");
		}

		const submission = await this.codeRepository.updateUserSubmission(
			userId,
			request.problemId,
			request.userCode,
			request.language,
			result
		);

		if (submission.creditsEarned > 0) {
			await this.userRepository.updateUser({
				id: userId,
				credits: user.credits + submission.creditsEarned,
				pointsScored: user.pointsScored + submission.score,
			});
		}

		result.submissionId = submission.id;
	}
}
