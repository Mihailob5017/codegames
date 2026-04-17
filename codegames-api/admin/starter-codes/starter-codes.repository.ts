import prisma from "../../infrastructure/prisma";
import { Language } from "@prisma/client";

class StarterCodesRepository {
	getStarterCodesByProblemId(problemId: string) {
		return prisma.starterCode.findMany({ where: { problemId } });
	}

	addStarterCodeToProblem(
		problemId: string,
		data: { language: Language; code: string },
	) {
		return prisma.starterCode.create({
			data: {
				language: data.language,
				code: data.code,
				problem: { connect: { id: problemId } },
			},
		});
	}

	bulkAddStarterCodesToProblem(
		problemId: string,
		data: { language: Language; code: string }[],
	) {
		return prisma.starterCode.createMany({
			data: data.map((sc) => ({
				problemId,
				language: sc.language,
				code: sc.code,
			})),
			skipDuplicates: true,
		});
	}
}

export default StarterCodesRepository;
