import { CodeRepository } from "../../repositories/code/code-respositories";
import { CodePreparationService } from "./code-preparation-service";
import {
	CodeExecutionValidationService,
	ExecutionResult,
} from "./code-execution-validation-service";
import { HttpError } from "../../types/common/error-types";

export interface CodeSubmissionRequest {
	problemId: string;
	userCode: string;
	language: "javascript" | "python";
	runAllTests?: boolean;
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

	constructor() {
		this.codePreparationService = new CodePreparationService();
		this.codeExecutionService = new CodeExecutionValidationService();
		this.codeRepository = new CodeRepository();
	}

	async runSingleTestCase(
		request: CodeSubmissionRequest
	): Promise<TestCaseResult> {
		try {
			console.log("CodeService: Starting runSingleTestCase with:", request);

			// Step 1: Prepare code and get test data
			console.log("CodeService: About to prepare code...");
			const preparedData =
				await this.codePreparationService.prepareCodeForExecution({
					problemId: request.problemId,
					userCode: request.userCode,
					language: request.language,
				});
			console.log(
				"CodeService: Code prepared successfully, test case:",
				preparedData.testCase?.id
			);

			// Step 2: Execute the prepared code
			console.log("CodeService: About to execute code...");
			const executionResult =
				await this.codeExecutionService.validateAndExecuteCode({
					code: preparedData.preparedCode,
					language: request.language,
					timeLimit: preparedData.testCase.timeLimit,
				});
			console.log("CodeService: Code executed, result:", executionResult);

			// Step 3: Parse and format result
			const result = this.formatTestCaseResult(
				preparedData.testCase,
				executionResult
			);
			console.log("CodeService: Final result:", result);
			return result;
		} catch (error) {
			console.error("CodeService error:", error);
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
			// Step 1: Prepare code and get all test data
			const preparedData =
				await this.codePreparationService.prepareCodeForExecution({
					problemId: request.problemId,
					userCode: request.userCode,
					language: request.language,
				});

			const testResults: TestCaseResult[] = [];
			let passedTests = 0;

			// Step 2: Run each test case
			for (const testCase of preparedData.allTestCases) {
				try {
					// Prepare code for this specific test case
					const testSpecificCode = this.prepareCodeForSpecificTest(
						request.userCode,
						testCase,
						request.language
					);

					// Execute the test
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
			// Run all test cases first
			const result = await this.runAllTestCases(request);

			// If all tests pass, submit the code
			if (result.success) {
				const submissionResult = await this.codeRepository.submitCode(
					request.userCode,
					request.problemId
				);
				result.submissionId = submissionResult.executionId;
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
		
		// Parse input parameters
		const inputArgs = this.parseInputParameters(input);
		const argsString = inputArgs.map((arg: any) => JSON.stringify(arg)).join(', ');

		switch (language) {
			case "javascript":
				return `
// User's solution
${userCode}

// Test execution
try {
	const expectedOutput = ${JSON.stringify(expectedOutput)};
	
	// Call user function with parsed arguments
	const result = solution(${argsString});
	
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

# Test execution
try:
	expected_output = ${JSON.stringify(expectedOutput)}
	
	# Call user function with parsed arguments
	result = solution(${argsString})
	
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
		"expected": ${JSON.stringify(expectedOutput)},
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
			// Split by newlines to handle multiple parameters
			const lines = input.trim().split('\n');
			return lines.map(line => {
				try {
					// Try to parse as JSON
					return JSON.parse(line);
				} catch {
					// If parsing fails, return as string
					return line;
				}
			});
		} else if (Array.isArray(input)) {
			// If it's already an array, return as is
			return input;
		} else {
			// Single parameter
			return [input];
		}
	}
}
