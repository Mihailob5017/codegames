import { Prisma } from "@prisma/client";
import ProblemsRepository from "./problems.repository";
import {
	CreateProblemInput,
	ProblemQueryFilters,
} from "./problems.dto";

class ProblemsService {
	private readonly repository: ProblemsRepository;

	constructor() {
		this.repository = new ProblemsRepository();
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

	createProblem({ testCases, starterCodes, ...problemData }: CreateProblemInput) {
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
}

export default ProblemsService;
