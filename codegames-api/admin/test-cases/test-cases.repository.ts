import prisma from "../../infrastructure/prisma";

class TestCasesRepository {
	getTestCasesByProblemId(problemId: string) {
		return prisma.testCase.findMany({ where: { problemId } });
	}

	addTestCaseToProblem(
		problemId: string,
		data: { input: string; expectedOutput: string; isSample?: boolean },
	) {
		return prisma.testCase.create({
			data: {
				input: data.input,
				expectedOutput: data.expectedOutput,
				isSample: data.isSample ?? false,
				problem: { connect: { id: problemId } },
			},
		});
	}

	bulkAddTestCasesToProblem(
		problemId: string,
		data: { input: string; expectedOutput: string; isSample?: boolean }[],
	) {
		return prisma.testCase.createMany({
			data: data.map((tc) => ({
				problemId,
				input: tc.input,
				expectedOutput: tc.expectedOutput,
				isSample: tc.isSample ?? false,
			})),
		});
	}
}

export default TestCasesRepository;
