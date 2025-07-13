import { CreateUserInput } from '../../models/user-model';
import { SignupService } from '../../services/login/login-service';
import {
	ControllerFn,
	ResponseObject,
} from '../../types/common/controller-types';

export class LoginController {
	static signup: ControllerFn = async (req, res, next) => {
		try {
			const userInput: CreateUserInput = req.body;
			const signupInstance = new SignupService(userInput);

			signupInstance.checkUserInput();

			const responseObj = ResponseObject.success(200, 'Hello Admin');
			responseObj.send(res);
		} catch (error) {
			next(error);
		}
	};
}
