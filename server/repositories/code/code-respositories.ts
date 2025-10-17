import { Problem, TestCase } from "../../generated/prisma";
import { PrismaServiceInstance } from "../../config/prisma-config";

interface ICodeRepository {
	getProblem(id: string): Promise<Problem | null>;
	getTestCase(id: string): Promise<TestCase | null>;
	getAllTestCases(id: string): Promise<TestCase[] | null>;
	submitCode(code: string, problemId: string): Promise<any>;
}

export class CodeRepository implements ICodeRepository {
	async getProblem(id: string): Promise<Problem | null> {
		try {
			const problem = await PrismaServiceInstance.getClient().problem.findUnique({
				where: { id },
			});
			return problem;
		} catch (error) {
			throw new Error(`Failed to get problem: ${error}`);
		}
	}

	async getTestCase(id: string): Promise<TestCase | null> {
		try {
			const testCase =
				await PrismaServiceInstance.getClient().testCase.findFirst({
					where: { problemId: id, isExample: true },
				});
			return testCase;
		} catch (error) {
			throw new Error(`Failed to get testcase: ${error}`);
		}
	}
	async getAllTestCases(id: string): Promise<TestCase[] | null> {
		try {
			const testcases =
				await PrismaServiceInstance.getClient().testCase.findMany({
					where: { problemId: id },
				});
			return testcases;
		} catch (error) {
			throw new Error(`Failed to get testcase: ${error}`);
		}
	}

	async submitCode(code: string, problemId: string): Promise<any> {
		try {
			return {
				success: true,
				executionId: `exec_${Date.now()}`,
				code,
				problemId,
				submittedAt: new Date(),
			};
		} catch (error) {
			throw new Error(`Failed to submit code: ${error}`);
		}
	}
}
