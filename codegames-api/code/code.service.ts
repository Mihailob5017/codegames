import { Language, StarterCode, type TestCase } from "@prisma/client";
import CodeRepository from "./code.repository";
import PistonService from "./piston.service";
import CodePreparationService from "./code-preparation.service";
import type { CodeExecutionInput } from "./code.dto";
import { NotFoundError } from "../shared/errors/app-error";

function deepEqual(a: string, b: string): boolean {
	try {
		const parsedA = JSON.parse(a);
		const parsedB = JSON.parse(b);
		return JSON.stringify(parsedA) === JSON.stringify(parsedB);
	} catch {
		return a === b;
	}
}

export interface TestResult {
	id: string;
	passed: boolean;
	input: string;
	expected: string;
	actual: string;
}

export interface RunResult {
	allPassed: boolean;
	total: number;
	passed: number;
	failed: number;
	results: TestResult[];
	stderr?: string;
}

class CodeService {
	private readonly codeRepository: CodeRepository;
	private readonly codePreparationService: CodePreparationService;
	private readonly pistonService: PistonService;

	constructor(pistonUrl: string) {
		this.codeRepository = new CodeRepository();
		this.codePreparationService = new CodePreparationService();
		this.pistonService = new PistonService(pistonUrl);
	}

	async run(body: CodeExecutionInput): Promise<RunResult> {
		const { problemId } = body;
		const testCases =
			await this.codeRepository.getSampleTestCases(problemId);
		if (testCases.length === 0) {
			throw new NotFoundError(
				"No test cases found for the given problem ID",
			);
		}
		return this._runWithTestCases(body, testCases);
	}

	async execute(body: CodeExecutionInput): Promise<RunResult> {
		const { problemId } = body;
		const testCases = await this.codeRepository.getAllTestCases(problemId);
		if (testCases.length === 0) {
			throw new NotFoundError(
				"No test cases found for the given problem ID",
			);
		}
		return this._runWithTestCases(body, testCases);
	}

	private async _runWithTestCases(
		body: CodeExecutionInput,
		testCases: TestCase[],
	): Promise<RunResult> {
		const { code, language } = body;
		const wrappedCode = this.codePreparationService.wrapCode(
			code,
			language as Language,
			testCases,
		);
		const { stdout, stderr } = await this.pistonService.execute(
			language as Language,
			wrappedCode,
		);
		return this.compareOutputs(testCases, stdout, stderr);
	}

	private compareOutputs(
		testArray: TestCase[],
		stdout: string,
		stderr: string,
	): RunResult {
		if (stderr) {
			return {
				total: testArray.length,
				passed: 0,
				failed: testArray.length,
				allPassed: false,
				results: testArray.map((testcase) => ({
					id: testcase.id,
					passed: false,
					input: testcase.input,
					expected: testcase.expectedOutput.trim(),
					actual: "",
				})),
				stderr,
			};
		}

		const lines = stdout.trim().split("\n");

		const results: TestResult[] = testArray.map((testcase, i) => {
			const actual = (lines[i] ?? "").trim();
			const expected = testcase.expectedOutput.trim();
			return {
				id: testcase.id,
				passed: deepEqual(actual, expected),
				input: testcase.input,
				expected,
				actual,
			};
		});

		return {
			total: testArray.length,
			passed: results.filter((r) => r.passed).length,
			failed: results.filter((r) => !r.passed).length,
			allPassed: results.every((r) => r.passed),
			results,
		};
	}

	getSupportedLanguages(): string[] {
		return Object.values(Language);
	}

	async getStarterCode(problemId: string): Promise<StarterCode[]> {
		const starterCode = await this.codeRepository.getStarterCode(problemId);
		if (!starterCode) {
			throw new NotFoundError(
				"Starter code not found for the given problem ID",
			);
		}
		return starterCode;
	}
}

export default CodeService;
