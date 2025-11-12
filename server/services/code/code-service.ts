import { CodeRepository } from "../../repositories/code/code-respositories";
import { CodePreparationService } from "./code-preparation-service";
import {
	CodeExecutionValidationService,
	ExecutionResult,
} from "./code-execution-validation-service";
import { HttpError } from "../../types/common/error-types";
import { UserRepository } from "../../repositories/login/login-repositories";

export interface CodeSubmissionRequest {
	problemId: string;
	userCode: string;
	language: "javascript" | "python";
	runAllTests?: boolean;
	userId?: string;
}

export interface TestCaseResult {
	testCaseId: string;
	passed: boolean;
	input: any;
	expectedOutput: any;
	actualOutput?: any;
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
	runAllTestCases(
		request: CodeSubmissionRequest
	): Promise<CodeSubmissionResult>;
	submitCodeSolution(
		request: CodeSubmissionRequest
	): Promise<CodeSubmissionResult>;
}

export class CodeService implements ICodeService {
	private codePreparationService: CodePreparationService;
	private codeExecutionService: CodeExecutionValidationService;
	private codeRepository: CodeRepository;
	private userRepository: UserRepository;

	constructor() {
		this.codePreparationService = new CodePreparationService();
		this.codeExecutionService = new CodeExecutionValidationService();
		this.codeRepository = new CodeRepository();
		this.userRepository = new UserRepository();
	}

	async runSingleTestCase(
		request: CodeSubmissionRequest
	): Promise<TestCaseResult> {
		try {
			const preparedData =
				await this.codePreparationService.prepareCodeForExecution({
					problemId: request.problemId,
					userCode: request.userCode,
					language: request.language,
				});

			const executionResult =
				await this.codeExecutionService.validateAndExecuteCode({
					code: preparedData.preparedCode,
					language: request.language,
					timeLimit: preparedData.testCase.timeLimit,
				});

			return this.formatTestCaseResult(preparedData.testCase, executionResult);
		} catch (error) {
			throw new HttpError(
				500,
				`Failed to run test case: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		}
	}

	async runAllTestCases(
		request: CodeSubmissionRequest
	): Promise<CodeSubmissionResult> {
		const startTime = Date.now();

		try {
			const preparedData =
				await this.codePreparationService.prepareCodeForExecution({
					problemId: request.problemId,
					userCode: request.userCode,
					language: request.language,
				});

			const testResults: TestCaseResult[] = [];
			let passedTests = 0;

			for (const testCase of preparedData.allTestCases) {
				try {
					const testSpecificCode = this.prepareCodeForSpecificTest(
						request.userCode,
						testCase,
						request.language
					);

					const executionResult =
						await this.codeExecutionService.validateAndExecuteCode({
							code: testSpecificCode,
							language: request.language,
							timeLimit: testCase.timeLimit,
						});

					const testResult = this.formatTestCaseResult(
						testCase,
						executionResult
					);
					testResults.push(testResult);

					if (testResult.passed) {
						passedTests++;
					}
				} catch (error) {
					testResults.push({
						testCaseId: testCase.id,
						passed: false,
						input: testCase.input,
						expectedOutput: testCase.expectedOutput,
						executionTime: 0,
						error: error instanceof Error ? error.message : "Unknown error",
					});
				}
			}

			return {
				success: passedTests === preparedData.allTestCases.length,
				totalTests: preparedData.allTestCases.length,
				passedTests,
				testResults,
				overallExecutionTime: Date.now() - startTime,
			};
		} catch (error) {
			throw new HttpError(
				500,
				`Failed to run all test cases: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		}
	}

	async submitCodeSolution(
		request: CodeSubmissionRequest
	): Promise<CodeSubmissionResult> {
		try {
			const result = await this.runAllTestCases(request);
			const userId = request.userId;

			if (userId) {
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

				// Update user credits and points if the submission was successful
				if (submissionResult.creditsEarned > 0) {
					await this.userRepository.updateUser({
						id: userId,
						credits: user.credits + submissionResult.creditsEarned,
						pointsScored: user.pointsScored + submissionResult.score,
					});
				}

				result.submissionId = submissionResult.id;
			}

			return result;
		} catch (error) {
			throw new HttpError(
				500,
				`Failed to submit code: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		}
	}

	private prepareCodeForSpecificTest(
		userCode: string,
		testCase: any,
		language: string
	): string {
		const input = this.formatInput(testCase.input);
		const expectedOutput = this.formatOutput(testCase.expectedOutput);

		const inputArgs = this.parseInputParameters(input);
		const argsString = inputArgs
			.map((arg: any) => JSON.stringify(arg))
			.join(", ");

		switch (language) {
			case "javascript":
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
			case "python":
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
			default:
				throw new Error(`Unsupported language: ${language}`);
		}
	}

	private formatTestCaseResult(
		testCase: any,
		executionResult: ExecutionResult
	): TestCaseResult {
		let passed = false;
		let actualOutput: any = undefined;
		let error: string | undefined = undefined;

		if (executionResult.success && executionResult.output) {
			try {
				const result = JSON.parse(executionResult.output);
				passed = result.passed;
				actualOutput = result.output;
				if (result.error) {
					error = result.error;
				}
			} catch {
				error = "Failed to parse execution result";
			}
		} else {
			error = executionResult.error || "Execution failed";
		}

		return {
			testCaseId: testCase.id,
			passed,
			input: testCase.input,
			expectedOutput: testCase.expectedOutput,
			actualOutput,
			executionTime: executionResult.executionTime,
			error,
		};
	}

	private formatInput(input: any): any {
		if (typeof input === "string") {
			try {
				return JSON.parse(input);
			} catch {
				return input;
			}
		}
		return input;
	}

	private formatOutput(output: any): any {
		if (typeof output === "string") {
			try {
				return JSON.parse(output);
			} catch {
				return output;
			}
		}
		return output;
	}

	private parseInputParameters(input: any): any[] {
		if (typeof input === "string") {
			const lines = input.trim().split("\n");
			return lines.map((line) => {
				try {
					return JSON.parse(line);
				} catch {
					return line;
				}
			});
		} else if (Array.isArray(input)) {
			return input;
		} else if (typeof input === "object" && input !== null) {
			const keys = Object.keys(input).sort();
			return keys.map((key) => input[key]);
		} else {
			return [input];
		}
	}
}
