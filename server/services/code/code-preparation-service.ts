import { TestCase } from "../../generated/prisma";
import { SupportedLanguage } from "./judge0-service";

export class CodePreparationService {
	wrapCodeForTestCase(
		userCode: string,
		testCase: TestCase,
		language: SupportedLanguage
	): string {
		const input = this.parseJson(testCase.input);
		const expectedOutput = this.parseJson(testCase.expectedOutput);
		const args = this.extractArgs(input);

		switch (language) {
			case "javascript":
				return this.wrapJavaScript(userCode, args, expectedOutput);
			case "python":
				return this.wrapPython(userCode, args, expectedOutput);
			case "java":
				return this.wrapJava(userCode, args, expectedOutput);
			case "cpp":
				return this.wrapCpp(userCode, args, expectedOutput);
		}
	}

	private wrapJavaScript(
		userCode: string,
		args: unknown[],
		expectedOutput: unknown
	): string {
		const argsString = args.map((arg) => JSON.stringify(arg)).join(", ");

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
		args: unknown[],
		expectedOutput: unknown
	): string {
		const argsString = args.map((arg) => JSON.stringify(arg)).join(", ");

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

	private wrapJava(
		userCode: string,
		args: unknown[],
		expectedOutput: unknown
	): string {
		const argsString = args.map((arg) => this.toJavaLiteral(arg)).join(", ");
		const expectedJson = JSON.stringify(expectedOutput);

		return `
import java.util.*;

${userCode}

class Main {
    public static void main(String[] args) {
        try {
            Solution sol = new Solution();
            Object result = sol.solution(${argsString});
            String resultJson = toJson(result);
            String expectedJson = "${expectedJson.replace(/"/g, '\\"')}";
            boolean passed = resultJson.equals(expectedJson);
            System.out.println("{\\"success\\": true, \\"output\\": " + resultJson
                + ", \\"expected\\": " + expectedJson
                + ", \\"passed\\": " + passed + "}");
        } catch (Exception e) {
            System.out.println("{\\"success\\": false, \\"error\\": \\"" + e.getMessage() + "\\", \\"output\\": null, \\"passed\\": false}");
        }
    }

    static String toJson(Object obj) {
        if (obj instanceof int[]) {
            int[] arr = (int[]) obj;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(",");
                sb.append(arr[i]);
            }
            return sb.append("]").toString();
        }
        if (obj instanceof String) return "\\"" + obj + "\\"";
        if (obj instanceof Boolean) return obj.toString();
        return String.valueOf(obj);
    }
}
`;
	}

	private wrapCpp(
		userCode: string,
		args: unknown[],
		expectedOutput: unknown
	): string {
		const argsString = args.map((arg) => this.toCppLiteral(arg)).join(", ");
		const expectedJson = JSON.stringify(expectedOutput);

		return `
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
using namespace std;

${userCode}

template<typename T>
string toJson(const T& val);

template<>
string toJson(const int& val) { return to_string(val); }

template<>
string toJson(const double& val) { return to_string(val); }

template<>
string toJson(const bool& val) { return val ? "true" : "false"; }

template<>
string toJson(const string& val) { return "\\"" + val + "\\""; }

template<typename T>
string toJson(const vector<T>& vec) {
    string result = "[";
    for (size_t i = 0; i < vec.size(); i++) {
        if (i > 0) result += ",";
        result += toJson(vec[i]);
    }
    return result + "]";
}

int main() {
    try {
        auto result = solution(${argsString});
        string resultJson = toJson(result);
        string expectedJson = "${expectedJson.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}";
        bool passed = resultJson == expectedJson;
        cout << "{\\"success\\": true, \\"output\\": " << resultJson
             << ", \\"expected\\": " << expectedJson
             << ", \\"passed\\": " << (passed ? "true" : "false") << "}" << endl;
    } catch (exception& e) {
        cout << "{\\"success\\": false, \\"error\\": \\"" << e.what()
             << "\\", \\"output\\": null, \\"passed\\": false}" << endl;
    }
    return 0;
}
`;
	}

	private toJavaLiteral(value: unknown): string {
		if (Array.isArray(value)) {
			return `new int[]{${value.join(", ")}}`;
		}
		if (typeof value === "string") return `"${value}"`;
		if (typeof value === "boolean") return value.toString();
		return String(value);
	}

	private toCppLiteral(value: unknown): string {
		if (Array.isArray(value)) {
			return `vector<int>{${value.join(", ")}}`;
		}
		if (typeof value === "string") return `"${value}"`;
		if (typeof value === "boolean") return value ? "true" : "false";
		return String(value);
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
