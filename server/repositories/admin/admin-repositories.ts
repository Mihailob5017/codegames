import { PrismaServiceInstance } from '../../config/prisma-config';
import { Prisma, Problem, TestCase, User } from '../../generated/prisma';
import { ProblemDTO, TestCaseDTO } from '../../types/dto/problem-types';

export interface IAdminRepository {
	getAllUsers(): Promise<User[]>;
	getUser(id: string): Promise<User | null>;
	deleteUser(id: string): Promise<User>;
	addTestcase(testcase: TestCaseDTO, problemId: string): Promise<TestCase>;
	addProblem(problem: ProblemDTO): Promise<Problem>;
	getProblems(): Promise<Problem[]>;
	getProblem(id: string): Promise<Problem | null>;
	getTestCases(id: string): Promise<TestCase[]>;
	getTestCase(id: string): Promise<TestCase | null>;
	updateTestCase(param: Partial<TestCase>, id: string): Promise<TestCase>;
	updateProblem(param: Partial<Problem>, id: string): Promise<Problem>;
	deleteProblem(id: string): Promise<boolean>;
	deleteTestCase(id: string): Promise<boolean>;
	deleteTestCases(problemId: string): Promise<boolean>;
}

export class AdminRepository implements IAdminRepository {
	async getAllUsers(): Promise<User[]> {
		try {
			return await PrismaServiceInstance.getClient().user.findMany();
		} catch (error) {
			throw new Error(`Failed to get all users: ${error}`);
		}
	}

	async getUser(id: string): Promise<User | null> {
		try {
			if (!id || !id.trim()) {
				throw new Error('User ID is required');
			}

			return await PrismaServiceInstance.getClient().user.findUnique({
				where: { id },
			});
		} catch (error) {
			throw new Error(`Failed to get user: ${error}`);
		}
	}

	async deleteUser(id: string): Promise<User> {
		try {
			if (!id || !id.trim()) {
				throw new Error('User ID is required');
			}

			return await PrismaServiceInstance.getClient().user.delete({
				where: { id },
			});
		} catch (error) {
			throw new Error(`Failed to delete user: ${error}`);
		}
	}

	async addProblem(problem: ProblemDTO): Promise<Problem> {
		try {
			return await PrismaServiceInstance.getClient().problem.create({
				data: problem,
			});
		} catch (error) {
			throw new Error(`Failed to add problem: ${error}`);
		}
	}

	async addTestcase(testcase: TestCaseDTO, problemId: string): Promise<any> {
		try {
			return await PrismaServiceInstance.getClient().testCase.create({
				data: {
					input: testcase.input,
					expectedOutput: testcase.expectedOutput,
					isExample: testcase.isExample,
					isHidden: testcase.isHidden,
					timeLimit: testcase.timeLimit,
					memoryLimit: testcase.memoryLimit,
					problem: {
						connect: {
							id: problemId,
						},
					},
				},
			});
		} catch (error) {
			throw new Error(`Failed to add testcase: ${error}`);
		}
	}

	async getProblems(): Promise<Problem[]> {
		try {
			return await PrismaServiceInstance.getClient().problem.findMany();
		} catch (error) {
			throw new Error(`Failed to get problems: ${error}`);
		}
	}

	async getProblem(id: string): Promise<Problem | null> {
		try {
			return await PrismaServiceInstance.getClient().problem.findUnique({
				where: { id },
			});
		} catch (error) {
			throw new Error(`Failed to get problem: ${error}`);
		}
	}
	async getTestCases(id: string): Promise<TestCase[]> {
		try {
			return await PrismaServiceInstance.getClient().testCase.findMany({
				where: {
					problemId: id,
				},
			});
		} catch (error) {
			throw new Error(`Failed to get testcases: ${error}`);
		}
	}
	async getTestCase(id: string): Promise<TestCase | null> {
		try {
			return await PrismaServiceInstance.getClient().testCase.findUnique({
				where: { id },
			});
		} catch (error) {
			throw new Error(`Failed to get testcase: ${error}`);
		}
	}

	async updateTestCase(
		param: Partial<TestCase>,
		id: string
	): Promise<TestCase> {
		try {
			return await PrismaServiceInstance.getClient().testCase.update({
				where: { id },
				data: param as Prisma.TestCaseUpdateInput,
			});
		} catch (error) {
			throw new Error(`Failed to update testcase: ${error}`);
		}
	}

	async updateProblem(param: Partial<Problem>, id: string): Promise<Problem> {
		try {
			return await PrismaServiceInstance.getClient().problem.update({
				where: { id },
				data: param as Prisma.ProblemUpdateInput,
			});
		} catch (error) {
			throw new Error(`Failed to update problem: ${error}`);
		}
	}

	async deleteProblem(id: string): Promise<boolean> {
		try {
			await PrismaServiceInstance.getClient().problem.delete({
				where: { id },
			});
			return true;
		} catch (error) {
			throw new Error(`Failed to delete problem: ${error}`);
		}
	}

	async deleteTestCase(id: string): Promise<boolean> {
		try {
			await PrismaServiceInstance.getClient().testCase.delete({
				where: { id },
			});
			return true;
		} catch (error) {
			throw new Error(`Failed to delete testcase: ${error}`);
		}
	}

	async deleteTestCases(problemId: string): Promise<boolean> {
		try {
			await PrismaServiceInstance.getClient().testCase.deleteMany({
				where: { problemId },
			});
			return true;
		} catch (error) {
			throw new Error(`Failed to delete all testcases: ${error}`);
		}
	}
}
