import { deleteUser, getAllUsers, getUser } from '../services/admin-service';
import { ControllerFn, ResponseObject } from '../types/common/controller-types';
import { HttpError } from '../types/common/error-types';

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
			const users = await getAllUsers();
			const responseObj = ResponseObject.success(200, 'All users', users);
			responseObj.send(res);
		} catch (error) {
			next(error);
		}
	};
	static getUser: ControllerFn = async (req, res, next) => {
		try {
			const { id } = req.params;
			const user = await getUser(id);
			if (!user) {
				throw new HttpError(404, 'User not found');
			}
			const responseObj = ResponseObject.success(200, 'User', user);
			responseObj.send(res);
		} catch (error) {
			next(error);
		}
	};
}
