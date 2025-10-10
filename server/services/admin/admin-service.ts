import { User, Problem, TestCase } from '../../generated/prisma';
import {
	AdminRepository,
	IAdminRepository,
} from '../../repositories/admin-repositories';
import { HttpError } from '../../types/common/error-types';
import { ProblemDTO, TestCaseDTO } from '../../types/dto/problem-types';

export interface IAdminService {
	getAllUsers(): Promise<User[]>;
	getUser(id: string): Promise<User | null>;
	deleteUser(id: string): Promise<User>;
	addProblem(problem: ProblemDTO): Promise<Problem>;
	addTestcase(testcase: TestCaseDTO, problemId: string): Promise<TestCase>;
	getProblems(): Promise<Problem[]>;
	getProblem(id: string): Promise<Problem | null>;
	getTestCases(problemId: string): Promise<TestCase[]>;
	getTestCase(id: string): Promise<TestCase | null>;
	updateTestCase(param: Partial<TestCase>, id: string): Promise<TestCase>;
	updateProblem(param: Partial<Problem>, id: string): Promise<Problem>;
	deleteProblem(id: string): Promise<boolean>;
	deleteTestCase(id: string): Promise<boolean>;
	deleteTestCases(problemId: string): Promise<boolean>;
}
export class AdminService implements IAdminService {
	private adminRepository: IAdminRepository;

	constructor(adminRepository?: IAdminRepository) {
		this.adminRepository = adminRepository || new AdminRepository();
	}

	async getAllUsers(): Promise<User[]> {
		try {
			const users = await this.adminRepository.getAllUsers();
			if (!users || users.length === 0) {
				throw new HttpError(404, 'No users found');
			}
			return users;
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new Error(`Failed to get all users: ${error}`);
		}
	}

	async getUser(id: string): Promise<User | null> {
		try {
			if (!id) {
				throw new HttpError(400, 'User ID is required');
			}

			const user = await this.adminRepository.getUser(id);
			if (!user) {
				throw new HttpError(404, 'User not found');
			}
			return user;
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new Error(`Failed to get user: ${error}`);
		}
	}

	async deleteUser(id: string): Promise<User> {
		try {
			if (!id) {
				throw new HttpError(400, 'User ID is required');
			}

			const user = await this.adminRepository.getUser(id);
			if (!user) {
				throw new HttpError(404, 'User not found');
			}
			return await this.adminRepository.deleteUser(id);
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new Error(`Failed to delete user: ${error}`);
		}
	}

	async addProblem(problem: ProblemDTO): Promise<Problem> {
		try {
			return await this.adminRepository.addProblem(problem);
		} catch (error) {
			throw new Error(`Failed to add problem: ${error}`);
		}
	}
	async addTestcase(
		testcase: TestCaseDTO,
		problemId: string
	): Promise<TestCase> {
		try {
			return await this.adminRepository.addTestcase(testcase, problemId);
		} catch (error) {
			throw new Error(`Failed to add testcase: ${error}`);
		}
	}

	async getProblems(): Promise<Problem[]> {
		try {
			return await this.adminRepository.getProblems();
		} catch (error) {
			throw new Error(`Failed to get problems: ${error}`);
		}
	}

	async getProblem(id: string): Promise<Problem | null> {
		try {
			return await this.adminRepository.getProblem(id);
		} catch (error) {
			throw new Error(`Failed to get problem: ${error}`);
		}
	}

	async getTestCases(problemId: string): Promise<TestCase[]> {
		try {
			return await this.adminRepository.getTestCases(problemId);
		} catch (error) {
			throw new Error(`Failed to get testcases: ${error}`);
		}
	}
	async getTestCase(id: string): Promise<TestCase | null> {
		try {
			return await this.adminRepository.getTestCase(id);
		} catch (error) {
			throw new Error(`Failed to get testcase: ${error}`);
		}
	}

	async updateTestCase(
		param: Partial<TestCase>,
		id: string
	): Promise<TestCase> {
		try {
			return await this.adminRepository.updateTestCase(param, id);
		} catch (error) {
			throw new Error(`Failed to update testcase: ${error}`);
		}
	}

	async updateProblem(param: Partial<Problem>, id: string): Promise<Problem> {
		try {
			return await this.adminRepository.updateProblem(param, id);
		} catch (error) {
			throw new Error(`Failed to update problem: ${error}`);
		}
	}

	async deleteProblem(id: string): Promise<boolean> {
		try {
			return await this.adminRepository.deleteProblem(id);
		} catch (error) {
			throw new Error(`Failed to delete problem: ${error}`);
		}
	}

	async deleteTestCase(id: string): Promise<boolean> {
		try {
			return await this.adminRepository.deleteTestCase(id);
		} catch (error) {
			throw new Error(`Failed to delete testcase: ${error}`);
		}
	}

	async deleteTestCases(problemId: string): Promise<boolean> {
		try {
			return await this.adminRepository.deleteTestCases(problemId);
		} catch (error) {
			throw new Error(`Failed to delete all testcases: ${error}`);
		}
	}
}

export default AdminService;
