import prisma from "../infrastructure/prisma";

class CodeRepository {
	getSampleTestCases(problemId: string) {
		return prisma.testCase.findMany({ where: { problemId, isSample: true } });
	}
}

export default CodeRepository;
