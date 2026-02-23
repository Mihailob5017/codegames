import {
	createMockNext,
	createMockRequest,
	createMockResponse,
	mockStarterCode,
} from "../../__tests__/utils/test-helpers";
import { ValidationError } from "../../errors/app-error";

jest.mock("./starter-codes.service");

import StarterCodesService from "./starter-codes.service";
import StarterCodesController from "./starter-codes.controller";

const MockStarterCodesService = StarterCodesService as jest.MockedClass<
	typeof StarterCodesService
>;

let mockService: jest.Mocked<StarterCodesService>;

describe("StarterCodesController", () => {
	beforeAll(() => {
		mockService = MockStarterCodesService.mock
			.instances[0] as jest.Mocked<StarterCodesService>;
	});

	describe("getStarterCodesByProblemId", () => {
		it("returns 200 with starter codes", async () => {
			mockService.getStarterCodesByProblemId.mockResolvedValue([mockStarterCode] as any);

			const req = createMockRequest({ params: { id: "problem-id-1" } });
			const res = createMockResponse();

			await StarterCodesController.getStarterCodesByProblemId(
				req as any,
				res as any,
				createMockNext(),
			);

			expect((res as any).status).toHaveBeenCalledWith(200);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				data: [mockStarterCode],
			});
		});
	});

	describe("addStarterCodeToProblem", () => {
		it("returns 201 with the created starter code", async () => {
			mockService.addStarterCodeToProblem.mockResolvedValue(mockStarterCode as any);

			const req = createMockRequest({
				params: { id: "problem-id-1" },
				body: { language: "JAVASCRIPT", code: "function twoSum() {}" },
			});
			const res = createMockResponse();

			await StarterCodesController.addStarterCodeToProblem(
				req as any,
				res as any,
				createMockNext(),
			);

			expect((res as any).status).toHaveBeenCalledWith(201);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				data: mockStarterCode,
			});
		});
	});

	describe("bulkAddStarterCodesToProblem", () => {
		it("returns 201 with the insert count for a valid array", async () => {
			mockService.bulkAddStarterCodesToProblem.mockResolvedValue({ count: 2 });

			const req = createMockRequest({
				params: { id: "problem-id-1" },
				body: [
					{ language: "JAVASCRIPT", code: "function twoSum() {}" },
					{ language: "PYTHON", code: "def two_sum():" },
				],
			});
			const res = createMockResponse();

			await StarterCodesController.bulkAddStarterCodesToProblem(
				req as any,
				res as any,
				createMockNext(),
			);

			expect((res as any).status).toHaveBeenCalledWith(201);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				data: { count: 2 },
			});
		});

		it("throws ValidationError when body is an empty array", async () => {
			const req = createMockRequest({ params: { id: "problem-id-1" }, body: [] });
			const res = createMockResponse();

			await expect(
				StarterCodesController.bulkAddStarterCodesToProblem(
					req as any,
					res as any,
					createMockNext(),
				),
			).rejects.toBeInstanceOf(ValidationError);

			expect(mockService.bulkAddStarterCodesToProblem).not.toHaveBeenCalled();
		});

		it("throws ValidationError when language is invalid", async () => {
			const req = createMockRequest({
				params: { id: "problem-id-1" },
				body: [{ language: "COBOL", code: "IDENTIFICATION DIVISION." }],
			});
			const res = createMockResponse();

			await expect(
				StarterCodesController.bulkAddStarterCodesToProblem(
					req as any,
					res as any,
					createMockNext(),
				),
			).rejects.toBeInstanceOf(ValidationError);
		});
	});
});
