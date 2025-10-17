import { Request, Response, NextFunction } from "express";
import { CodeExecutionController } from "./code-controller";
import { CodeExecutionService } from "../../services/code-execution/code-execution-service";

jest.mock("../../services/code-execution/code-execution-service");

describe("CodeExecutionController", () => {
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let mockNext: NextFunction;
	let mockSend: jest.Mock;
	let mockStatus: jest.Mock;

	beforeEach(() => {
		mockSend = jest.fn();
		mockStatus = jest.fn().mockReturnValue({ json: mockSend });
		mockResponse = {
			status: mockStatus,
		};
		mockNext = jest.fn();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("getSupportedLanguages", () => {
		it("should get supported languages successfully", async () => {
			const mockLanguages = [
				{ id: "javascript", name: "JavaScript (Node.js)", extension: ".js" },
				{ id: "python", name: "Python 3", extension: ".py" },
			];

			const mockCodeExecutionService = {
				getLanguages: jest.fn().mockResolvedValue(mockLanguages),
			};

			(
				CodeExecutionService as jest.MockedClass<typeof CodeExecutionService>
			).mockImplementation(() => mockCodeExecutionService as any);

			mockRequest = {};

			await CodeExecutionController.getSupportedLanguages(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockCodeExecutionService.getLanguages).toHaveBeenCalled();
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockSend).toHaveBeenCalledWith({
				message: "Supported languages retrieved successfully",
				data: mockLanguages,
			});
		});

		it("should handle errors correctly", async () => {
			const error = new Error("Service error");
			const mockCodeExecutionService = {
				getLanguages: jest.fn().mockRejectedValue(error),
			};

			(
				CodeExecutionService as jest.MockedClass<typeof CodeExecutionService>
			).mockImplementation(() => mockCodeExecutionService as any);

			mockRequest = {};

			await CodeExecutionController.getSupportedLanguages(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockNext).toHaveBeenCalledWith(error);
		});
	});

	describe("executeCode", () => {
		it("should execute code successfully", async () => {
			const mockSubmission = {
				source_code: 'print("Hello World")',
				language: "python",
			};

			const mockResult = {
				success: true,
				stdout: "Hello World\n",
				execution_time_ms: 150,
			};

			const mockCodeExecutionService = {
				executeCode: jest.fn().mockResolvedValue(mockResult),
			};

			(
				CodeExecutionService as jest.MockedClass<typeof CodeExecutionService>
			).mockImplementation(() => mockCodeExecutionService as any);

			mockRequest = {
				body: mockSubmission,
			};

			await CodeExecutionController.executeCode(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockCodeExecutionService.executeCode).toHaveBeenCalledWith({
				source_code: mockSubmission.source_code,
				language: mockSubmission.language,
				stdin: undefined,
			});
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockSend).toHaveBeenCalledWith({
				message: "Code executed successfully",
				data: mockResult,
			});
		});

		it("should handle validation errors", async () => {
			mockRequest = {
				body: {
					source_code: "",
					language: "invalid",
				},
			};

			await CodeExecutionController.executeCode(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 400,
					message: "Validation error",
				})
			);
		});
	});
});
