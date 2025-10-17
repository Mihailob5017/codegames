import { Problem, TestCase } from "../../generated/prisma";
import { CodeRepository } from "../../repositories/code/code-respositories";
import { HttpError } from "../../types/common/error-types";

export interface PreparedCodeData {
	problem: Problem;
	testCase: TestCase;
	allTestCases: TestCase[];
	preparedCode: string;
	language: string;
	originalCode: string;
	problemId: string;
}

export interface CodePreparationRequest {
	problemId: string;
	userCode: string;
	language: "javascript" | "python";
}

interface ICodePreparationService {
	prepareCodeForExecution(
		request: CodePreparationRequest
	): Promise<PreparedCodeData>;
	getSingleTestCase(problemId: string): Promise<TestCase>;
	getAllTestCases(problemId: string): Promise<TestCase[]>;
}

export class CodePreparationService implements ICodePreparationService {
	private codeRepository: CodeRepository;

	constructor() {
		this.codeRepository = new CodeRepository();
	}

	async prepareCodeForExecution(
		request: CodePreparationRequest
	): Promise<PreparedCodeData> {
		const { problemId, userCode, language } = request;

		const problem = await this.codeRepository.getProblem(problemId);
		if (!problem) {
			throw new HttpError(404, `Problem with ID ${problemId} not found`);
		}

		const testCase = await this.getSingleTestCase(problemId);
		const allTestCases = await this.getAllTestCases(problemId);

		const preparedCode = this.wrapUserCodeForExecution(
			userCode,
			testCase,
			language
		);

		return {
			problem,
			testCase,
			allTestCases,
			preparedCode,
			language,
			originalCode: userCode,
			problemId,
		};
	}

	async getSingleTestCase(problemId: string): Promise<TestCase> {
		const testCase = await this.codeRepository.getTestCase(problemId);
		if (!testCase) {
			throw new HttpError(404, `Test case not found for problem ${problemId}`);
		}
		return testCase;
	}

	async getAllTestCases(problemId: string): Promise<TestCase[]> {
		const testCases = await this.codeRepository.getAllTestCases(problemId);
		if (!testCases || testCases.length === 0) {
			throw new HttpError(404, `No test cases found for problem ${problemId}`);
		}
		return testCases;
	}

	private wrapUserCodeForExecution(
		userCode: string,
		testCase: TestCase,
		language: string
	): string {
		const input = this.formatInput(testCase.input);
		const expectedOutput = this.formatOutput(testCase.expectedOutput);

		switch (language) {
			case "javascript":
				return this.wrapJavaScriptCode(userCode, input, expectedOutput);
			case "python":
				return this.wrapPythonCode(userCode, input, expectedOutput);
			default:
				throw new Error(`Unsupported language: ${language}`);
		}
	}

	private wrapJavaScriptCode(
		userCode: string,
		input: any,
		expectedOutput: any
	): string {
		// Parse input - it might be multiple parameters separated by newlines
		const inputArgs = this.parseInputParameters(input);
		const argsString = inputArgs.map(arg => JSON.stringify(arg)).join(', ');
		
		return `
// User's solution
${userCode}

// Test execution
try {
	const expectedOutput = ${JSON.stringify(expectedOutput)};
	
	// Call user's function with the parsed arguments
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
	}

	private wrapPythonCode(
		userCode: string,
		input: any,
		expectedOutput: any
	): string {
		// Parse input - it might be multiple parameters separated by newlines
		const inputArgs = this.parseInputParameters(input);
		const argsString = inputArgs.map(arg => JSON.stringify(arg)).join(', ');
		
		return `
import json

# User's solution
${userCode}

# Test execution
try:
	expected_output = ${JSON.stringify(expectedOutput)}
	
	# Call user's function with the parsed arguments
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
