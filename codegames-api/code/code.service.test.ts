import { mockTestCase } from "../__tests__/utils/test-helpers";
import { NotFoundError } from "../errors/app-error";

jest.mock("./code.repository");
jest.mock("./wrapper.service");
jest.mock("./piston.service");

import CodeRepository from "./code.repository";
import WrapperService from "./wrapper.service";
import { PistonService } from "./piston.service";
import CodeService from "./code.service";

const MockCodeRepository = CodeRepository as jest.MockedClass<typeof CodeRepository>;
const MockWrapperService = WrapperService as jest.MockedClass<typeof WrapperService>;
const MockPistonService = PistonService as jest.MockedClass<typeof PistonService>;

describe("CodeService", () => {
	let service: CodeService;
	let mockRepo: jest.Mocked<CodeRepository>;
	let mockWrapper: jest.Mocked<WrapperService>;
	let mockPiston: jest.Mocked<PistonService>;

	const validInput = {
		code: "function twoSum() {}",
		language: "JAVASCRIPT" as const,
		problemId: "problem-id-1",
	};

	beforeEach(() => {
		service = new CodeService("http://piston.test");
		mockRepo = MockCodeRepository.mock.instances[0] as jest.Mocked<CodeRepository>;
		mockWrapper = MockWrapperService.mock.instances[0] as jest.Mocked<WrapperService>;
		mockPiston = MockPistonService.mock.instances[0] as jest.Mocked<PistonService>;
	});

	// ─── run ──────────────────────────────────────────────────────────────────

	describe("run", () => {
		it("throws NotFoundError when no sample test cases exist", async () => {
			mockRepo.getSampleTestCases.mockResolvedValue([]);

			await expect(service.run(validInput)).rejects.toBeInstanceOf(NotFoundError);
			expect(mockWrapper.wrapCode).not.toHaveBeenCalled();
		});

		it("returns RunResult with passing tests when stdout matches expected", async () => {
			mockRepo.getSampleTestCases.mockResolvedValue([mockTestCase] as any);
			mockWrapper.wrapCode.mockReturnValue("wrapped code");
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
			mockWrapper.wrapCode.mockReturnValue("wrapped code");
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

	// ─── execute ──────────────────────────────────────────────────────────────

	describe("execute", () => {
		it("throws NotFoundError when no test cases exist", async () => {
			mockRepo.getAllTestCases.mockResolvedValue([]);

			await expect(service.execute(validInput)).rejects.toBeInstanceOf(NotFoundError);
		});

		it("returns RunResult with passing tests", async () => {
			mockRepo.getAllTestCases.mockResolvedValue([mockTestCase] as any);
			mockWrapper.wrapCode.mockReturnValue("wrapped code");
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
			mockWrapper.wrapCode.mockReturnValue("wrapped code");
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
