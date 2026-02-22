import { Prisma } from "@prisma/client";
import AdminRepository from "./admin.repository";
import { ProblemQueryFilters } from "../util/validation-schema";

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

	createProblem(data: Prisma.ProblemCreateInput) {
		return this.repository.createProblem(data);
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
}

export default AdminService;
