import prisma from "../infrastructure/prisma";

class CodeRepository {
	getSampleTestCases(problemId: string) {
		return prisma.testCase.findMany({ where: { problemId, isSample: true }, orderBy: { id: "asc" } });
	}

	getAllTestCases(problemId: string) {
		return prisma.testCase.findMany({ where: { problemId }, orderBy: { id: "asc" } });
	}
}

export default CodeRepository;
