import { Language, Prisma } from "@prisma/client";
import AdminRepository from "./admin.repository";
import {
	BulkAddStarterCodesInput,
	BulkAddTestCasesInput,
	CreateProblemInput,
	ProblemQueryFilters,
} from "../util/validation-schema";

class AdminService {
	private readonly repository: AdminRepository;

	constructor() {
		this.repository = new AdminRepository();
	}

	getAllProblems() {
		return this.repository.getAllProblems();
	}

	queryProblems(filters: ProblemQueryFilters) {
		return this.repository.queryProblems(filters);
	}

	getProblemById(id: string) {
		return this.repository.getProblemById(id);
	}

	getStarterCodesByProblemId(problemId: string) {
		return this.repository.getStarterCodesByProblemId(problemId);
	}

	addStarterCodeToProblem(
		problemId: string,
		data: { language: Language; code: string },
	) {
		return this.repository.addStarterCodeToProblem(problemId, data);
	}

	createProblem({
		testCases,
		starterCodes,
		...problemData
	}: CreateProblemInput) {
		return this.repository.createProblem({
			...problemData,
			...(testCases.length > 0 && { TestCases: { create: testCases } }),
			...(starterCodes.length > 0 && {
				StarterCodes: { create: starterCodes },
			}),
		});
	}

	updateProblem(id: string, data: Prisma.ProblemUpdateInput) {
		return this.repository.updateProblem(id, data);
	}

	deleteProblem(id: string) {
		return this.repository.deleteProblem(id);
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

	bulkAddStarterCodesToProblem(
		problemId: string,
		data: BulkAddStarterCodesInput,
	) {
		return this.repository.bulkAddStarterCodesToProblem(problemId, data);
	}
}

export default AdminService;
