import { CreateUserInput } from '../../models/user-model';
import { SignupService } from '../../services/login/login-service';
import {
	ControllerFn,
	ResponseObject,
} from '../../types/common/controller-types';

export class LoginController {
	static signup: ControllerFn = async (req, res, next) => {
		try {
			const signupService = new SignupService(req.body);
			await signupService.normalizeInput();
			await signupService.validateInput();
			await signupService.checkIfUserExists();
			await signupService.saveUser();
			const responseObj = ResponseObject.success(
				200,
				'User successfully created'
			);
			responseObj.send(res);
		} catch (error) {
			next(error);
		}
	};
}
