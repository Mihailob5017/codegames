import AdminService from '../../services/admin/admin-service';
import {
	ControllerFn,
	ResponseObject,
} from '../../types/common/controller-types';

export class AdminController {
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
			const users = await AdminService.getAllUsers();
			const responseObj = ResponseObject.success(200, 'All users', users);
			responseObj.send(res);
		} catch (error) {
			next(error);
		}
	};
	static getUser: ControllerFn = async (req, res, next) => {
		try {
			const { id } = req.params;
			const user = await AdminService.getUser(id);
			const responseObj = ResponseObject.success(200, 'User found', user);
			responseObj.send(res);
		} catch (error) {
			next(error);
		}
	};

	static deleteUser: ControllerFn = async (req, res, next) => {
		try {
			const { id } = req.params;
			const user = await AdminService.deleteUser(id);
			const responseObj = ResponseObject.success(
				200,
				'User  successfully deleted',
				user
			);
			responseObj.send(res);
		} catch (error) {
			next(error);
		}
	};
}
