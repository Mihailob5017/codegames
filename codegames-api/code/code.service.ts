import type { Language } from "@prisma/client";
import CodeRepository from "./code.repository";
import { PistonService } from "./piston.service";
import WrapperService from "./wrapper.service";
import type { CodeExecutionInput } from "../util/validation-schema";

export interface TestResult {
	passed: boolean;
	input: string;
	expected: string;
	actual: string;
}

export interface RunResult {
	allPassed: boolean;
	results: TestResult[];
	stderr?: string;
}

class CodeService {
	private readonly codeRepository: CodeRepository;
	private readonly wrapperService: WrapperService;
	private readonly pistonService: PistonService;

	constructor(pistonUrl: string) {
		this.codeRepository = new CodeRepository();
		this.wrapperService = new WrapperService();
		this.pistonService = new PistonService(pistonUrl);
	}

	async run(body: CodeExecutionInput): Promise<RunResult | any> {
		const { code, language, problemId } = body;
		const testCases = await this.codeRepository.getSampleTestCases(problemId);

		if (testCases.length === 0) {
			throw new Error("No test cases found for the given problem ID");
		}

		const wrappedCode = this.wrapperService.wrapCode(
			code,
			language as Language,
			testCases,
		);

		const { stdout, stderr } = await this.pistonService.execute(
			language as Language,
			wrappedCode,
		);
		console.log("WE OUT ERE BOIIII");
		console.log(stdout, stderr);
	}

	private compareOutputs(actual: string, expected: string): boolean {
		try {
			return (
				JSON.stringify(JSON.parse(actual)) ===
				JSON.stringify(JSON.parse(expected))
			);
		} catch {
			return actual === expected.trim();
		}
	}
}

export default CodeService;
