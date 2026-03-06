import TestCasesRepository from "./test-cases.repository";
import { BulkAddTestCasesInput } from "./test-cases.dto";

class TestCasesService {
	private readonly repository: TestCasesRepository;

	constructor() {
		this.repository = new TestCasesRepository();
	}

	getTestCasesByProblemId(problemId: string) {
		return this.repository.getTestCasesByProblemId(problemId);
	}

	addTestCaseToProblem(
		problemId: string,
		data: { input: string; expectedOutput: string; isSample?: boolean },
	) {
		return this.repository.addTestCaseToProblem(problemId, data);
	}

	bulkAddTestCasesToProblem(problemId: string, data: BulkAddTestCasesInput) {
		return this.repository.bulkAddTestCasesToProblem(problemId, data);
	}
}

export default TestCasesService;
