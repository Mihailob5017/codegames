import { RedisService, RedisServiceInstance } from '../../config/redis-config';
import { extractTokenFromRequest } from '../../middlewares/auth-middleware';
import { AuthService } from '../../services/auth/auth-service';
import {
	ControllerFn,
	ResponseObject,
} from '../../types/common/controller-types';
import { verifyJWT } from '../../utils/auth';

export class LoginController {
	static signup: ControllerFn = async (req, res, next) => {
		try {
			const authService = new AuthService(req.body);
			const response = await authService.signup();

			const responseObj = ResponseObject.success(
				201,
				'User successfully created. A verification token has been sent to your email.',
				response
			);

			responseObj.send(res);
		} catch (error) {
			next(error);
		}
	};

	static login: ControllerFn = async (req, res, next) => {
		try {
			const authService = new AuthService(req.body);
			const response = await authService.login();

			const responseObj = ResponseObject.success(
				200,
				'Login successful',
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

			if (!otp) {
				return next(new Error('OTP is required'));
			}

			const otpNumber = parseInt(otp, 10);
			if (isNaN(otpNumber)) {
				return next(new Error('Valid numeric OTP is required'));
			}

			const token = extractTokenFromRequest(req);
			if (!token) {
				return next(new Error('Authorization token is required'));
			}
			const { id } = verifyJWT(token);

			const authService = new AuthService({});
			await authService.verifyOTP(token, otpNumber);

			const responseObj = ResponseObject.success(
				200,
				'Email verified successfully. Your account is now active.'
			);

			const redisService: RedisService = RedisServiceInstance;

			await redisService.set(`user:verified:${id}`, 'true');
			responseObj.send(res);
		} catch (error) {
			next(error);
		}
	};

	static resendOTP: ControllerFn = async (req, res, next) => {
		try {
			const token = extractTokenFromRequest(req);

			if (!token) {
				return next(new Error('Authorization token is required'));
			}

			const authService = new AuthService({});
			await authService.resendOTP(token);

			const responseObj = ResponseObject.success(
				200,
				'OTP has been resent to your email address'
			);

			responseObj.send(res);
		} catch (error) {
			next(error);
		}
	};
}
