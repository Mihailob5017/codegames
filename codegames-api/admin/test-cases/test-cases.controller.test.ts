import {
	createMockNext,
	createMockRequest,
	createMockResponse,
	mockTestCase,
} from "../../__tests__/utils/test-helpers";
import { ValidationError } from "../../errors/app-error";

jest.mock("./test-cases.service");

import TestCasesService from "./test-cases.service";
import TestCasesController from "./test-cases.controller";

const MockTestCasesService = TestCasesService as jest.MockedClass<
	typeof TestCasesService
>;

let mockService: jest.Mocked<TestCasesService>;

describe("TestCasesController", () => {
	beforeAll(() => {
		mockService = MockTestCasesService.mock
			.instances[0] as jest.Mocked<TestCasesService>;
	});

	describe("getTestCasesByProblemId", () => {
		it("returns 200 with the test cases", async () => {
			mockService.getTestCasesByProblemId.mockResolvedValue([mockTestCase] as any);

			const req = createMockRequest({ params: { id: "problem-id-1" } });
			const res = createMockResponse();

			await TestCasesController.getTestCasesByProblemId(
				req as any,
				res as any,
				createMockNext(),
			);

			expect((res as any).status).toHaveBeenCalledWith(200);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				data: [mockTestCase],
			});
		});
	});

	describe("addTestCaseToProblem", () => {
		it("returns 201 with the created test case", async () => {
			mockService.addTestCaseToProblem.mockResolvedValue(mockTestCase as any);

			const req = createMockRequest({
				params: { id: "problem-id-1" },
				body: { input: "[2,7]\n9", expectedOutput: "[0,1]", isSample: true },
			});
			const res = createMockResponse();

			await TestCasesController.addTestCaseToProblem(
				req as any,
				res as any,
				createMockNext(),
			);

			expect((res as any).status).toHaveBeenCalledWith(201);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				data: mockTestCase,
			});
		});
	});

	describe("bulkAddTestCasesToProblem", () => {
		it("returns 201 with the insert count for a valid array", async () => {
			mockService.bulkAddTestCasesToProblem.mockResolvedValue({ count: 2 });

			const req = createMockRequest({
				params: { id: "problem-id-1" },
				body: [
					{ input: "[2,7]\n9", expectedOutput: "[0,1]", isSample: true },
					{ input: "[3,2,4]\n6", expectedOutput: "[1,2]", isSample: false },
				],
			});
			const res = createMockResponse();

			await TestCasesController.bulkAddTestCasesToProblem(
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
				TestCasesController.bulkAddTestCasesToProblem(
					req as any,
					res as any,
					createMockNext(),
				),
			).rejects.toBeInstanceOf(ValidationError);

			expect(mockService.bulkAddTestCasesToProblem).not.toHaveBeenCalled();
		});

		it("throws ValidationError when body is not an array", async () => {
			const req = createMockRequest({
				params: { id: "problem-id-1" },
				body: { input: "1", expectedOutput: "2" },
			});
			const res = createMockResponse();

			await expect(
				TestCasesController.bulkAddTestCasesToProblem(
					req as any,
					res as any,
					createMockNext(),
				),
			).rejects.toBeInstanceOf(ValidationError);
		});
	});
});
