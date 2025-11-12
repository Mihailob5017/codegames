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

	// Call user's function with the parsed arguments
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

	# Call user's function with the parsed arguments
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
		} else if (typeof input === "object" && input !== null) {
			// Extract values from object in sorted key order for consistent parameter passing
			// This allows users to write solution(s) instead of solution(input)
			// Example: {"s": "test"} becomes ["test"]
			// Example: {"nums": [1,2], "target": 3} becomes [[1,2], 3]
			const keys = Object.keys(input).sort();
			return keys.map((key) => input[key]);
		} else {
			// Single parameter
			return [input];
		}
	}
}
