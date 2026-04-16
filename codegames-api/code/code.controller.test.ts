import {
	createMockNext,
	createMockRequest,
	createMockResponse,
} from "../shared/test-utils/test-helpers";
import { ValidationError } from "../shared/errors/app-error";

jest.mock("./code.service");

import CodeService from "./code.service";
import CodeController from "./code.controller";

const MockCodeService = CodeService as jest.MockedClass<typeof CodeService>;

let mockService: jest.Mocked<CodeService>;

const validBody = {
	code: "function twoSum() {}",
	language: "JAVASCRIPT",
	problemId: "problem-id-1",
};

const mockRunResult = {
	allPassed: true,
	total: 1,
	passed: 1,
	failed: 0,
	results: [],
};

describe("CodeController", () => {
	beforeAll(() => {
		mockService = MockCodeService.mock.instances[0] as jest.Mocked<CodeService>;
	});

	describe("healthCheck", () => {
		it("returns 200 with status ok", async () => {
			const req = createMockRequest();
			const res = createMockResponse();

			await CodeController.healthCheck(req as any, res as any, createMockNext());

			expect((res as any).json).toHaveBeenCalledWith({
				status: "ok",
				message: "Hello from CodeController",
			});
		});
	});

	describe("executeCode", () => {
		it("returns 200 with result for valid input", async () => {
			mockService.execute.mockResolvedValue(mockRunResult);

			const req = createMockRequest({ body: validBody });
			const res = createMockResponse();

			await CodeController.executeCode(req as any, res as any, createMockNext());

			expect(mockService.execute).toHaveBeenCalledWith(
				expect.objectContaining({ code: validBody.code }),
			);
			expect((res as any).status).toHaveBeenCalledWith(200);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				data: mockRunResult,
			});
		});

		it("throws ValidationError for invalid input", async () => {
			const req = createMockRequest({ body: { code: "", language: "INVALID" } });
			const res = createMockResponse();

			await expect(
				CodeController.executeCode(req as any, res as any, createMockNext()),
			).rejects.toBeInstanceOf(ValidationError);

			expect(mockService.execute).not.toHaveBeenCalled();
		});
	});

	describe("runCode", () => {
		it("returns 200 with result for valid input", async () => {
			mockService.run.mockResolvedValue(mockRunResult);

			const req = createMockRequest({ body: validBody });
			const res = createMockResponse();

			await CodeController.runCode(req as any, res as any, createMockNext());

			expect(mockService.run).toHaveBeenCalledWith(
				expect.objectContaining({ code: validBody.code }),
			);
			expect((res as any).status).toHaveBeenCalledWith(200);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				data: mockRunResult,
			});
		});

		it("throws ValidationError for invalid input", async () => {
			const req = createMockRequest({ body: { problemId: "p-1" } });
			const res = createMockResponse();

			await expect(
				CodeController.runCode(req as any, res as any, createMockNext()),
			).rejects.toBeInstanceOf(ValidationError);

			expect(mockService.run).not.toHaveBeenCalled();
		});
	});
});
