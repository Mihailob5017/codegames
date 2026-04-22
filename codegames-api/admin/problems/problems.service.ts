import ProblemsRepository from "./problems.repository";
import {
	CreateProblemInput,
	ProblemQueryFilters,
	UpdateProblemInput,
} from "./problems.dto";
import { PaginatedResult, PaginationParams } from "../../shared/types/common.types";

class ProblemsService {
	private readonly repository: ProblemsRepository;

	constructor() {
		this.repository = new ProblemsRepository();
	}

	async getAllProblems(pagination: PaginationParams): Promise<PaginatedResult<unknown>> {
		const { data, total } = await this.repository.getAllProblems(pagination);
		return {
			data,
			pagination: {
				page: pagination.page,
				limit: pagination.limit,
				total,
				totalPages: Math.ceil(total / pagination.limit),
			},
		};
	}

	async queryProblems(filters: ProblemQueryFilters, pagination: PaginationParams): Promise<PaginatedResult<unknown>> {
		const { data, total } = await this.repository.queryProblems(filters, pagination);
		return {
			data,
			pagination: {
				page: pagination.page,
				limit: pagination.limit,
				total,
				totalPages: Math.ceil(total / pagination.limit),
			},
		};
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

	updateProblem(id: string, data: UpdateProblemInput) {
		return this.repository.updateProblem(id, data);
	}

	deleteProblem(id: string) {
		return this.repository.deleteProblem(id);
	}
}

export default ProblemsService;
