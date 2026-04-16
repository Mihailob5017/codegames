import { mockStarterCode } from "../../shared/test-utils/test-helpers";

jest.mock("./starter-codes.repository");

import StarterCodesRepository from "./starter-codes.repository";
import StarterCodesService from "./starter-codes.service";

const MockStarterCodesRepository = StarterCodesRepository as jest.MockedClass<
	typeof StarterCodesRepository
>;

describe("StarterCodesService", () => {
	let service: StarterCodesService;
	let mockRepo: jest.Mocked<StarterCodesRepository>;

	beforeEach(() => {
		service = new StarterCodesService();
		mockRepo = MockStarterCodesRepository.mock
			.instances[0] as jest.Mocked<StarterCodesRepository>;
	});

	describe("getStarterCodesByProblemId", () => {
		it("delegates to repository.getStarterCodesByProblemId", async () => {
			mockRepo.getStarterCodesByProblemId.mockResolvedValue([mockStarterCode] as any);

			const result = await service.getStarterCodesByProblemId("problem-id-1");

			expect(result).toEqual([mockStarterCode]);
			expect(mockRepo.getStarterCodesByProblemId).toHaveBeenCalledWith("problem-id-1");
		});
	});

	describe("addStarterCodeToProblem", () => {
		it("delegates to repository.addStarterCodeToProblem", async () => {
			mockRepo.addStarterCodeToProblem.mockResolvedValue(mockStarterCode as any);
			const data = { language: "JAVASCRIPT" as const, code: "function f() {}" };

			const result = await service.addStarterCodeToProblem("problem-id-1", data);

			expect(result).toEqual(mockStarterCode);
			expect(mockRepo.addStarterCodeToProblem).toHaveBeenCalledWith("problem-id-1", data);
		});
	});

	describe("bulkAddStarterCodesToProblem", () => {
		it("delegates to repository.bulkAddStarterCodesToProblem", async () => {
			mockRepo.bulkAddStarterCodesToProblem.mockResolvedValue({ count: 2 });
			const starterCodes = [
				{ language: "JAVASCRIPT" as const, code: "function f() {}" },
				{ language: "PYTHON" as const, code: "def f():" },
			];

			const result = await service.bulkAddStarterCodesToProblem("problem-id-1", starterCodes);

			expect(result).toEqual({ count: 2 });
			expect(mockRepo.bulkAddStarterCodesToProblem).toHaveBeenCalledWith("problem-id-1", starterCodes);
		});
	});
});
