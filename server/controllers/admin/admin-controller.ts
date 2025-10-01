import {
	AdminService,
	IAdminService,
} from '../../services/admin/admin-service';
import {
	ControllerFn,
	ResponseObject,
} from '../../types/common/controller-types';
import { HttpError } from '../../types/common/error-types';
import { ProblemDTO, TestCaseDTO } from '../../types/dto/problem-types';

export class AdminController {
	private static getAdminService(): IAdminService {
		return new AdminService();
	}

	private static validateId(id: string, fieldName: string = 'ID'): void {
		if (!id?.trim()) {
			throw new HttpError(400, `${fieldName} is required`);
		}
	}

	private static validateProblemData(problem: ProblemDTO): void {
		if (!problem) {
			throw new HttpError(400, 'Problem data is required');
		}
		if (!problem.title?.trim()) {
			throw new HttpError(400, 'Problem title is required');
		}
		if (!problem.description?.trim()) {
			throw new HttpError(400, 'Problem description is required');
		}
	}

	private static validateTestCaseData(testcase: TestCaseDTO): void {
		if (!testcase) {
			throw new HttpError(400, 'Test case data is required');
		}
		if (!testcase.input?.trim()) {
			throw new HttpError(400, 'Test case input is required');
		}
		if (!testcase.expectedOutput?.trim()) {
			throw new HttpError(400, 'Test case expected output is required');
		}
	}

	static whoami: ControllerFn = async (req, res, next) => {
		try {
			const responseObj = ResponseObject.success(200, 'Hello Admin');
			responseObj.send(res);
		} catch (error) {
			next(error);
		}
	};

	static getAllUsers: ControllerFn = async (req, res, next) => {
		try {
			const adminService = AdminController.getAdminService();
			const users = await adminService.getAllUsers();
			const responseObj = ResponseObject.success(200, 'All users', users);
			responseObj.send(res);
		} catch (error) {
			next(error);
		}
	};

	static getUser: ControllerFn = async (req, res, next) => {
		try {
			const { id } = req.params;
			AdminController.validateId(id, 'User ID');
			
			const adminService = AdminController.getAdminService();
			const user = await adminService.getUser(id);
			const responseObj = ResponseObject.success(200, 'User found', user);
			responseObj.send(res);
		} catch (error) {
			next(error);
		}
	};

	static deleteUser: ControllerFn = async (req, res, next) => {
		try {
			const { id } = req.params;
			AdminController.validateId(id, 'User ID');
			
			const adminService = AdminController.getAdminService();
			const user = await adminService.deleteUser(id);
			const responseObj = ResponseObject.success(
				200,
				'User successfully deleted',
				user
			);
			responseObj.send(res);
		} catch (error) {
			next(error);
		}
	};

	static addProblem: ControllerFn = async (req, res, next) => {
		try {
			AdminController.validateProblemData(req.body);
			
			const adminService = AdminController.getAdminService();
			const result = await adminService.addProblem(req.body);
			const responseObj = ResponseObject.success(
				201,
				'Problem added successfully',
				result
			);
			responseObj.send(res);
		} catch (error) {
			next(error);
		}
	};

	static addTestCase: ControllerFn = async (req, res, next) => {
		try {
			AdminController.validateTestCaseData(req.body);
			AdminController.validateId(req.params.problemId, 'Problem ID');
			
			const adminService = AdminController.getAdminService();
			const result = await adminService.addTestcase(
				req.body,
				req.params.problemId
			);
			const responseObj = ResponseObject.success(
				201,
				'Testcase added successfully',
				result
			);
			responseObj.send(res);
		} catch (error) {
			next(error);
		}
	};

	static getAllProblems: ControllerFn = async (req, res, next) => {
		try {
			const adminService = AdminController.getAdminService();
			const result = await adminService.getProblems();
			const responseObj = ResponseObject.success(
				200,
				'Problems fetched successfully',
				result
			);
			responseObj.send(res);
		} catch (error) {
			next(error);
		}
	};

	static getProblem: ControllerFn = async (req, res, next) => {
		try {
			AdminController.validateId(req.params.id, 'Problem ID');
			
			const adminService = AdminController.getAdminService();
			const result = await adminService.getProblem(req.params.id);
			const responseObj = ResponseObject.success(
				200,
				'Problem fetched successfully',
				result
			);
			responseObj.send(res);
		} catch (error) {
			next(error);
		}
	};

	static getAllTestCases: ControllerFn = async (req, res, next) => {
		try {
			AdminController.validateId(req.params.problemId, 'Problem ID');
			
			const adminService = AdminController.getAdminService();
			const result = await adminService.getTestCases(req.params.problemId);
			const responseObj = ResponseObject.success(
				200,
				'Testcases fetched successfully',
				result
			);
			responseObj.send(res);
		} catch (error) {
			next(error);
		}
	};
	static getTestCase: ControllerFn = async (req, res, next) => {
		try {
			AdminController.validateId(req.params.id, 'Test case ID');
			
			const adminService = AdminController.getAdminService();
			const result = await adminService.getTestCase(req.params.id);
			const responseObj = ResponseObject.success(
				200,
				'Testcase fetched successfully',
				result
			);
			responseObj.send(res);
		} catch (error) {
			next(error);
		}
	};
}
