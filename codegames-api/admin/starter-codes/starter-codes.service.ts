import { Language } from "@prisma/client";
import StarterCodesRepository from "./starter-codes.repository";
import { BulkAddStarterCodesInput } from "./starter-codes.dto";

class StarterCodesService {
	private readonly repository: StarterCodesRepository;

	constructor() {
		this.repository = new StarterCodesRepository();
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

	bulkAddStarterCodesToProblem(
		problemId: string,
		data: BulkAddStarterCodesInput,
	) {
		return this.repository.bulkAddStarterCodesToProblem(problemId, data);
	}
}

export default StarterCodesService;
