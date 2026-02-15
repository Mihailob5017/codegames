import { TestCase } from "../../generated/prisma";

export class CodePreparationService {
	wrapCodeForTestCase(
		userCode: string,
		testCase: TestCase,
		language: string
	): string {
		const input = this.parseJson(testCase.input);
		const expectedOutput = this.parseJson(testCase.expectedOutput);
		const argsString = this.extractArgs(input)
			.map((arg) => JSON.stringify(arg))
			.join(", ");

		return language === "javascript"
			? this.wrapJavaScript(userCode, argsString, expectedOutput)
			: this.wrapPython(userCode, argsString, expectedOutput);
	}

	private wrapJavaScript(
		userCode: string,
		argsString: string,
		expectedOutput: unknown
	): string {
		return `
${userCode}

function normalizeOutput(value, expected) {
	if (typeof value === 'boolean' && typeof expected === 'string') {
		return value.toString();
	}
	return value;
}

try {
	const expectedOutput = ${JSON.stringify(expectedOutput)};
	let result = solution(${argsString});
	result = normalizeOutput(result, expectedOutput);
	const passed = JSON.stringify(result) === JSON.stringify(expectedOutput);
	console.log(JSON.stringify({ success: true, output: result, expected: expectedOutput, passed }));
} catch (error) {
	console.log(JSON.stringify({ success: false, error: error.message, output: null, expected: ${JSON.stringify(expectedOutput)}, passed: false }));
}
`;
	}

	private wrapPython(
		userCode: string,
		argsString: string,
		expectedOutput: unknown
	): string {
		return `
import json

${userCode}

def normalize_output(value, expected):
    if isinstance(value, bool) and isinstance(expected, str):
        return 'true' if value else 'false'
    return value

try:
    expected_output = json.loads(${JSON.stringify(JSON.stringify(expectedOutput))})
    result = solution(${argsString})
    result = normalize_output(result, expected_output)
    passed = result == expected_output
    print(json.dumps({"success": True, "output": result, "expected": expected_output, "passed": passed}))
except Exception as error:
    print(json.dumps({"success": False, "error": str(error), "output": None, "expected": json.loads(${JSON.stringify(JSON.stringify(expectedOutput))}), "passed": False}))
`;
	}

	private parseJson(value: unknown): unknown {
		if (typeof value === "string") {
			try {
				return JSON.parse(value);
			} catch {
				return value;
			}
		}
		return value;
	}

	// Extracts ordered function arguments from test case input.
	// Object keys are sorted alphabetically: {"nums": [1,2], "target": 3} → [[1,2], 3]
	private extractArgs(input: unknown): unknown[] {
		if (typeof input === "string") {
			return input
				.trim()
				.split("\n")
				.map((line) => {
					try {
						return JSON.parse(line);
					} catch {
						return line;
					}
				});
		}

		if (Array.isArray(input)) {
			return input;
		}

		if (typeof input === "object" && input !== null) {
			const keys = Object.keys(input).sort();
			return keys.map((key) => (input as Record<string, unknown>)[key]);
		}

		return [input];
	}
}
