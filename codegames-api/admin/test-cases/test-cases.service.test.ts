import { mockTestCase } from "../../shared/test-utils/test-helpers";

jest.mock("./test-cases.repository");

import TestCasesRepository from "./test-cases.repository";
import TestCasesService from "./test-cases.service";

const MockTestCasesRepository = TestCasesRepository as jest.MockedClass<
	typeof TestCasesRepository
>;

describe("TestCasesService", () => {
	let service: TestCasesService;
	let mockRepo: jest.Mocked<TestCasesRepository>;

	beforeEach(() => {
		service = new TestCasesService();
		mockRepo = MockTestCasesRepository.mock
			.instances[0] as jest.Mocked<TestCasesRepository>;
	});

	describe("getTestCasesByProblemId", () => {
		it("delegates to repository.getTestCasesByProblemId", async () => {
			mockRepo.getTestCasesByProblemId.mockResolvedValue([mockTestCase] as any);

			const result = await service.getTestCasesByProblemId("problem-id-1");

			expect(result).toEqual([mockTestCase]);
			expect(mockRepo.getTestCasesByProblemId).toHaveBeenCalledWith("problem-id-1");
		});
	});

	describe("addTestCaseToProblem", () => {
		it("delegates to repository.addTestCaseToProblem", async () => {
			mockRepo.addTestCaseToProblem.mockResolvedValue(mockTestCase as any);
			const data = { input: "1", expectedOutput: "2", isSample: false };

			const result = await service.addTestCaseToProblem("problem-id-1", data);

			expect(result).toEqual(mockTestCase);
			expect(mockRepo.addTestCaseToProblem).toHaveBeenCalledWith("problem-id-1", data);
		});
	});

	describe("bulkAddTestCasesToProblem", () => {
		it("delegates to repository.bulkAddTestCasesToProblem", async () => {
			mockRepo.bulkAddTestCasesToProblem.mockResolvedValue({ count: 2 });
			const testCases = [
				{ input: "1", expectedOutput: "2", isSample: false },
				{ input: "3", expectedOutput: "4", isSample: true },
			];

			const result = await service.bulkAddTestCasesToProblem("problem-id-1", testCases);

			expect(result).toEqual({ count: 2 });
			expect(mockRepo.bulkAddTestCasesToProblem).toHaveBeenCalledWith("problem-id-1", testCases);
		});
	});
});
