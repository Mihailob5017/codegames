import { mockTestCase } from "../shared/test-utils/test-helpers";
import { NotFoundError } from "../shared/errors/app-error";

jest.mock("./code.repository");
jest.mock("./code-preparation.service");
jest.mock("./piston.service");

import CodeRepository from "./code.repository";
import CodePreparationService from "./code-preparation.service";
import { PistonService } from "./piston.service";
import CodeService from "./code.service";

const MockCodeRepository = CodeRepository as jest.MockedClass<
	typeof CodeRepository
>;
const MockCodePreparationService = CodePreparationService as jest.MockedClass<
	typeof CodePreparationService
>;
const MockPistonService = PistonService as jest.MockedClass<
	typeof PistonService
>;

// Helper to build a minimal TestCase-shaped object
function makeTestCase(id: string, input: string, expectedOutput: string) {
	return { id, input, expectedOutput, isSample: true, problemId: "p1" };
}

describe("CodeService", () => {
	let service: CodeService;
	let mockRepo: jest.Mocked<CodeRepository>;
	let mockCodePrep: jest.Mocked<CodePreparationService>;
	let mockPiston: jest.Mocked<PistonService>;

	const validInput = {
		code: "function twoSum() {}",
		language: "JAVASCRIPT" as const,
		problemId: "problem-id-1",
	};

	beforeEach(() => {
		service = new CodeService("http://piston.test");
		mockRepo = MockCodeRepository.mock
			.instances[0] as jest.Mocked<CodeRepository>;
		mockCodePrep = MockCodePreparationService.mock
			.instances[0] as jest.Mocked<CodePreparationService>;
		mockPiston = MockPistonService.mock
			.instances[0] as jest.Mocked<PistonService>;
	});

	// ─── run ──────────────────────────────────────────────────────────────────

	describe("run", () => {
		it("throws NotFoundError when no sample test cases exist", async () => {
			mockRepo.getSampleTestCases.mockResolvedValue([]);

			await expect(service.run(validInput)).rejects.toBeInstanceOf(
				NotFoundError,
			);
			expect(mockCodePrep.wrapCode).not.toHaveBeenCalled();
		});

		it("returns RunResult with passing tests when stdout matches expected", async () => {
			mockRepo.getSampleTestCases.mockResolvedValue([mockTestCase] as any);
			mockCodePrep.wrapCode.mockReturnValue("wrapped code");
			mockPiston.execute.mockResolvedValue({
				stdout: mockTestCase.expectedOutput + "\n",
				stderr: "",
				exitCode: 0,
			});

			const result = await service.run(validInput);

			expect(result.allPassed).toBe(true);
			expect(result.passed).toBe(1);
			expect(result.failed).toBe(0);
			expect(result.results[0].id).toBe(mockTestCase.id);
		});

		it("returns failed results with stderr when piston returns stderr", async () => {
			mockRepo.getSampleTestCases.mockResolvedValue([mockTestCase] as any);
			mockCodePrep.wrapCode.mockReturnValue("wrapped code");
			mockPiston.execute.mockResolvedValue({
				stdout: "",
				stderr: "ReferenceError: x is not defined",
				exitCode: 1,
			});

			const result = await service.run(validInput);

			expect(result.allPassed).toBe(false);
			expect(result.passed).toBe(0);
			expect(result.failed).toBe(1);
			expect(result.stderr).toBe("ReferenceError: x is not defined");
		});
	});

	// ─── compareOutputs (via run) ─────────────────────────────────────────────

	describe("compareOutputs", () => {
		it("passes when stdout exactly matches expected output", async () => {
			const tc = makeTestCase("tc1", "[1,2]", "3");
			mockRepo.getSampleTestCases.mockResolvedValue([tc] as any);
			mockCodePrep.wrapCode.mockReturnValue("wrapped");
			mockPiston.execute.mockResolvedValue({
				stdout: "3\n",
				stderr: "",
				exitCode: 0,
			});

			const result = await service.run(validInput);

			expect(result.results[0].passed).toBe(true);
		});

		it("passes when JSON output differs only in whitespace ([0,2] vs [0, 2])", async () => {
			const tc = makeTestCase("tc1", "[3,3]", "[0, 2]");
			mockRepo.getSampleTestCases.mockResolvedValue([tc] as any);
			mockCodePrep.wrapCode.mockReturnValue("wrapped");
			mockPiston.execute.mockResolvedValue({
				stdout: "[0,2]\n",
				stderr: "",
				exitCode: 0,
			});

			const result = await service.run(validInput);

			expect(result.results[0].passed).toBe(true);
		});

		it("passes when nested array whitespace differs ([[0,1],[2,3]] vs [[0, 1], [2, 3]])", async () => {
			const tc = makeTestCase("tc1", "input", "[[0, 1], [2, 3]]");
			mockRepo.getSampleTestCases.mockResolvedValue([tc] as any);
			mockCodePrep.wrapCode.mockReturnValue("wrapped");
			mockPiston.execute.mockResolvedValue({
				stdout: "[[0,1],[2,3]]\n",
				stderr: "",
				exitCode: 0,
			});

			const result = await service.run(validInput);

			expect(result.results[0].passed).toBe(true);
		});

		it("fails when actual value is wrong", async () => {
			const tc = makeTestCase("tc1", "[1,2]", "3");
			mockRepo.getSampleTestCases.mockResolvedValue([tc] as any);
			mockCodePrep.wrapCode.mockReturnValue("wrapped");
			mockPiston.execute.mockResolvedValue({
				stdout: "7\n",
				stderr: "",
				exitCode: 0,
			});

			const result = await service.run(validInput);

			expect(result.results[0].passed).toBe(false);
			expect(result.allPassed).toBe(false);
		});

		it("maps each stdout line to the correct test case index", async () => {
			const tc1 = makeTestCase("tc1", "[2,7]", "0 1");
			const tc2 = makeTestCase("tc2", "[3,3]", "0 1");
			const tc3 = makeTestCase("tc3", "[1,2]", "0 2");
			mockRepo.getSampleTestCases.mockResolvedValue([tc1, tc2, tc3] as any);
			mockCodePrep.wrapCode.mockReturnValue("wrapped");
			mockPiston.execute.mockResolvedValue({
				stdout: "0 1\n0 1\nWRONG\n",
				stderr: "",
				exitCode: 0,
			});

			const result = await service.run(validInput);

			expect(result.results[0].passed).toBe(true);
			expect(result.results[1].passed).toBe(true);
			expect(result.results[2].passed).toBe(false);
			expect(result.passed).toBe(2);
			expect(result.failed).toBe(1);
		});

		it("falls back to plain string comparison for non-JSON output", async () => {
			const tc = makeTestCase("tc1", "input", "hello world");
			mockRepo.getSampleTestCases.mockResolvedValue([tc] as any);
			mockCodePrep.wrapCode.mockReturnValue("wrapped");
			mockPiston.execute.mockResolvedValue({
				stdout: "hello world\n",
				stderr: "",
				exitCode: 0,
			});

			const result = await service.run(validInput);

			expect(result.results[0].passed).toBe(true);
		});
	});

	// ─── execute ──────────────────────────────────────────────────────────────

	describe("execute", () => {
		it("throws NotFoundError when no test cases exist", async () => {
			mockRepo.getAllTestCases.mockResolvedValue([]);

			await expect(service.execute(validInput)).rejects.toBeInstanceOf(
				NotFoundError,
			);
		});

		it("returns RunResult with passing tests", async () => {
			mockRepo.getAllTestCases.mockResolvedValue([mockTestCase] as any);
			mockCodePrep.wrapCode.mockReturnValue("wrapped code");
			mockPiston.execute.mockResolvedValue({
				stdout: mockTestCase.expectedOutput + "\n",
				stderr: "",
				exitCode: 0,
			});

			const result = await service.execute(validInput);

			expect(result.allPassed).toBe(true);
			expect(result.total).toBe(1);
		});

		it("returns failed results with stderr when piston returns stderr", async () => {
			mockRepo.getAllTestCases.mockResolvedValue([mockTestCase] as any);
			mockCodePrep.wrapCode.mockReturnValue("wrapped code");
			mockPiston.execute.mockResolvedValue({
				stdout: "",
				stderr: "SyntaxError: Unexpected token",
				exitCode: 1,
			});

			const result = await service.execute(validInput);

			expect(result.allPassed).toBe(false);
			expect(result.stderr).toBe("SyntaxError: Unexpected token");
		});
	});
});
