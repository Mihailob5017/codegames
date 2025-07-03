import { getAllUsers } from '../services/adminService';
import {
	ControllerFn,
	ErrorObject,
	ResponseObject,
} from '../types/common/controller.types';

export class AdminController {
	static whoami: ControllerFn = async (req, res, next) => {
		try {
			const response = new ResponseObject(200, 'You are admin', {});
			res.status(response.statusCode).json(response);
		} catch (error) {
			const errorResponse = ErrorObject.error(500, error);
			res.status(errorResponse.statusCode).json(errorResponse);
		}
	};
	static getAllUsers: ControllerFn = async (req, res, next) => {
		try {
			const users = await getAllUsers();
			const response = ResponseObject.success(
				200,
				'Users fetched successfully',
				users
			);
			res.status(response.statusCode).json(response);
		} catch (error) {
			const errorResponse = ErrorObject.error(500, error);
			res.status(errorResponse.statusCode).json(errorResponse);
		}
	};
}
