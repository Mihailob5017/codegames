import { extractTokenFromRequest } from '../../middlewares/auth-middleware';
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
			signupService.normalizeInput();
			signupService.validateInput();
			await signupService.checkIfUserExists();
			await signupService.saveUser();
			const response = await signupService.getResponse();
			signupService.sendVerificationToken();

			const responseObj = ResponseObject.success(
				200,
				'User successfully created, a verification token has been sent to your email',
				response
			);
			responseObj.send(res);
		} catch (error) {
			next(error);
		}
	};

	static verifyOTP: ControllerFn = async (req, res, next) => {
		try {
			const { otp } = req.body;
			const token = extractTokenFromRequest(req);
			const signupService = new SignupService({} as CreateUserInput);
			await signupService.getOTP(token as string);
			await signupService.verifyOTP(otp);
			await signupService.verifyUser();
			const responseObj = ResponseObject.success(
				200,
				'User successfully verified'
			);
			responseObj.send(res);
		} catch (error) {
			next(error);
		}
	};
}
