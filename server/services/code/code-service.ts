import { CodeRepository } from "../../repositories/code/code-respositories";
import { CodePreparationService } from "./code-preparation-service";
import {
	CodeExecutionValidationService,
	ExecutionResult,
} from "./code-execution-validation-service";
import { HttpError } from "../../types/common/error-types";
import { UserRepository } from "../../repositories/login/login-repositories";
import { TestCase } from "../../generated/prisma";

// ============================================================================
// Types and Interfaces
// ============================================================================

export type SupportedLanguage = "javascript" | "python";

export interface CodeSubmissionRequest {
	problemId: string;
	userCode: string;
	language: SupportedLanguage;
	runAllTests?: boolean;
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

interface ICodeService {
	runSingleTestCase(request: CodeSubmissionRequest): Promise<TestCaseResult>;
	runAllTestCases(request: CodeSubmissionRequest): Promise<CodeSubmissionResult>;
	submitCodeSolution(request: CodeSubmissionRequest): Promise<CodeSubmissionResult>;
}

// ============================================================================
// Code Service Implementation
// ============================================================================

export class CodeService implements ICodeService {
	private readonly codePreparationService: CodePreparationService;
	private readonly codeExecutionService: CodeExecutionValidationService;
	private readonly codeRepository: CodeRepository;
	private readonly userRepository: UserRepository;

	constructor() {
		this.codePreparationService = new CodePreparationService();
		this.codeExecutionService = new CodeExecutionValidationService();
		this.codeRepository = new CodeRepository();
		this.userRepository = new UserRepository();
	}

	// ========================================================================
	// Public Methods
	// ========================================================================

	async runSingleTestCase(request: CodeSubmissionRequest): Promise<TestCaseResult> {
		const preparedData = await this.codePreparationService.prepareCodeForExecution({
			problemId: request.problemId,
			userCode: request.userCode,
			language: request.language,
		});

		const executionResult = await this.codeExecutionService.validateAndExecuteCode({
			code: preparedData.preparedCode,
			language: request.language,
			timeLimit: preparedData.testCase.timeLimit,
		});

		return this.formatTestCaseResult(preparedData.testCase, executionResult);
	}

	async runAllTestCases(request: CodeSubmissionRequest): Promise<CodeSubmissionResult> {
		const startTime = Date.now();

		const preparedData = await this.codePreparationService.prepareCodeForExecution({
			problemId: request.problemId,
			userCode: request.userCode,
			language: request.language,
		});

		const testResults = await this.executeAllTestCases(
			request.userCode,
			request.language,
			preparedData.allTestCases
		);

		const passedTests = testResults.filter((result) => result.passed).length;

		return {
			success: passedTests === preparedData.allTestCases.length,
			totalTests: preparedData.allTestCases.length,
			passedTests,
			testResults,
			overallExecutionTime: Date.now() - startTime,
		};
	}

	async submitCodeSolution(request: CodeSubmissionRequest): Promise<CodeSubmissionResult> {
		const result = await this.runAllTestCases(request);

		if (request.userId) {
			await this.processAuthenticatedSubmission(request, result);
		}

		return result;
	}

	// ========================================================================
	// Private Helper Methods - Test Execution
	// ========================================================================

	private async executeAllTestCases(
		userCode: string,
		language: SupportedLanguage,
		testCases: TestCase[]
	): Promise<TestCaseResult[]> {
		const testResults: TestCaseResult[] = [];

		for (const testCase of testCases) {
			try {
				const testResult = await this.executeSingleTest(userCode, language, testCase);
				testResults.push(testResult);
			} catch (error) {
				testResults.push(this.createFailedTestResult(testCase, error));
			}
		}

		return testResults;
	}

	private async executeSingleTest(
		userCode: string,
		language: SupportedLanguage,
		testCase: TestCase
	): Promise<TestCaseResult> {
		const testSpecificCode = this.prepareCodeForSpecificTest(
			userCode,
			testCase,
			language
		);

		const executionResult = await this.codeExecutionService.validateAndExecuteCode({
			code: testSpecificCode,
			language,
			timeLimit: testCase.timeLimit,
		});

		return this.formatTestCaseResult(testCase, executionResult);
	}

	private createFailedTestResult(testCase: TestCase, error: unknown): TestCaseResult {
		return {
			testCaseId: testCase.id,
			passed: false,
			input: testCase.input,
			expectedOutput: testCase.expectedOutput,
			executionTime: 0,
			error: this.getErrorMessage(error),
		};
	}

	// ========================================================================
	// Private Helper Methods - Submission Processing
	// ========================================================================

	private async processAuthenticatedSubmission(
		request: CodeSubmissionRequest,
		result: CodeSubmissionResult
	): Promise<void> {
		const userId = request.userId!;

		const user = await this.userRepository.getUser(userId);
		if (!user) {
			throw new HttpError(404, "User not found");
		}

		const submissionResult = await this.codeRepository.updateUserSubmission(
			userId,
			request.problemId,
			request.userCode,
			request.language,
			result
		);

		// Update user credits and points if credits were earned
		if (submissionResult.creditsEarned > 0) {
			await this.updateUserRewards(userId, user.credits, user.pointsScored, submissionResult);
		}

		result.submissionId = submissionResult.id;
	}

	private async updateUserRewards(
		userId: string,
		currentCredits: number,
		currentPoints: number,
		submission: { creditsEarned: number; score: number }
	): Promise<void> {
		await this.userRepository.updateUser({
			id: userId,
			credits: currentCredits + submission.creditsEarned,
			pointsScored: currentPoints + submission.score,
		});
	}

	// ========================================================================
	// Private Helper Methods - Code Preparation
	// ========================================================================

	private prepareCodeForSpecificTest(
		userCode: string,
		testCase: TestCase,
		language: SupportedLanguage
	): string {
		const input = this.formatInput(testCase.input);
		const expectedOutput = this.formatOutput(testCase.expectedOutput);
		const inputArgs = this.parseInputParameters(input);
		const argsString = inputArgs.map((arg) => JSON.stringify(arg)).join(", ");

		return language === "javascript"
			? this.generateJavaScriptTestCode(userCode, argsString, expectedOutput)
			: this.generatePythonTestCode(userCode, argsString, expectedOutput);
	}

	private generateJavaScriptTestCode(
		userCode: string,
		argsString: string,
		expectedOutput: unknown
	): string {
		return `
// User's solution
${userCode}

// Helper function to normalize output for comparison
function normalizeOutput(value, expected) {
	// Convert boolean to string if expected is string "true" or "false"
	if (typeof value === 'boolean' && typeof expected === 'string') {
		return value.toString();
	}
	return value;
}

// Test execution
try {
	const expectedOutput = ${JSON.stringify(expectedOutput)};

	// Call user function with parsed arguments
	let result = solution(${argsString});

	// Normalize output for comparison
	result = normalizeOutput(result, expectedOutput);

	// Compare result with expected output
	const passed = JSON.stringify(result) === JSON.stringify(expectedOutput);

	console.log(JSON.stringify({
		success: true,
		output: result,
		expected: expectedOutput,
		passed: passed
	}));
} catch (error) {
	console.log(JSON.stringify({
		success: false,
		error: error.message,
		output: null,
		expected: ${JSON.stringify(expectedOutput)},
		passed: false
	}));
}
`;
	}

	private generatePythonTestCode(
		userCode: string,
		argsString: string,
		expectedOutput: unknown
	): string {
		return `
import json

# User's solution
${userCode}

# Helper function to normalize output for comparison
def normalize_output(value, expected):
	"""Convert types for comparison compatibility"""
	# Convert boolean to string if expected is string "true" or "false"
	if isinstance(value, bool) and isinstance(expected, str):
		return 'true' if value else 'false'
	return value

# Test execution
try:
	expected_output = json.loads(${JSON.stringify(JSON.stringify(expectedOutput))})

	# Call user function with parsed arguments
	result = solution(${argsString})

	# Normalize output for comparison
	result = normalize_output(result, expected_output)

	# Compare result with expected output
	passed = result == expected_output

	output = {
		"success": True,
		"output": result,
		"expected": expected_output,
		"passed": passed
	}
	print(json.dumps(output))
except Exception as error:
	output = {
		"success": False,
		"error": str(error),
		"output": None,
		"expected": json.loads(${JSON.stringify(JSON.stringify(expectedOutput))}),
		"passed": False
	}
	print(json.dumps(output))
`;
	}

	// ========================================================================
	// Private Helper Methods - Result Formatting
	// ========================================================================

	private formatTestCaseResult(
		testCase: TestCase,
		executionResult: ExecutionResult
	): TestCaseResult {
		if (!executionResult.success || !executionResult.output) {
			return {
				testCaseId: testCase.id,
				passed: false,
				input: testCase.input,
				expectedOutput: testCase.expectedOutput,
				actualOutput: undefined,
				executionTime: executionResult.executionTime,
				error: executionResult.error || "Execution failed",
			};
		}

		try {
			const result = JSON.parse(executionResult.output);
			return {
				testCaseId: testCase.id,
				passed: result.passed,
				input: testCase.input,
				expectedOutput: testCase.expectedOutput,
				actualOutput: result.output,
				executionTime: executionResult.executionTime,
				error: result.error,
			};
		} catch {
			return {
				testCaseId: testCase.id,
				passed: false,
				input: testCase.input,
				expectedOutput: testCase.expectedOutput,
				actualOutput: undefined,
				executionTime: executionResult.executionTime,
				error: "Failed to parse execution result",
			};
		}
	}

	// ========================================================================
	// Private Helper Methods - Data Parsing
	// ========================================================================

	private formatInput(input: unknown): unknown {
		if (typeof input === "string") {
			try {
				return JSON.parse(input);
			} catch {
				return input;
			}
		}
		return input;
	}

	private formatOutput(output: unknown): unknown {
		if (typeof output === "string") {
			try {
				return JSON.parse(output);
			} catch {
				return output;
			}
		}
		return output;
	}

	private parseInputParameters(input: unknown): unknown[] {
		// Handle string input (newline-separated parameters)
		if (typeof input === "string") {
			const lines = input.trim().split("\n");
			return lines.map((line) => {
				try {
					return JSON.parse(line);
				} catch {
					return line;
				}
			});
		}

		// Handle array input
		if (Array.isArray(input)) {
			return input;
		}

		// Handle object input (extract values in sorted key order)
		if (typeof input === "object" && input !== null) {
			const keys = Object.keys(input).sort();
			return keys.map((key) => (input as Record<string, unknown>)[key]);
		}

		// Handle primitive input
		return [input];
	}

	// ========================================================================
	// Utility Methods
	// ========================================================================

	private getErrorMessage(error: unknown): string {
		return error instanceof Error ? error.message : "Unknown error";
	}
}
