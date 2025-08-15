import { LoginController } from './login-controller';
import { AuthService } from '../../services/auth/auth-service';
import { ResponseObject } from '../../types/common/controller-types';
import { extractTokenFromRequest } from '../../middlewares/auth-middleware';
import { createMockRequest, createMockResponse, createMockNext, createMockUser } from '../../__tests__/utils/test-helpers';

jest.mock('../../services/auth/auth-service');
jest.mock('../../middlewares/auth-middleware');

describe('LoginController', () => {
	let mockAuthService: jest.Mocked<AuthService>;
	let req: any;
	let res: any;
	let next: any;

	beforeEach(() => {
		mockAuthService = {
			signup: jest.fn(),
			verifyOTP: jest.fn(),
		} as any;

		(AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService);

		req = createMockRequest();
		res = createMockResponse();
		next = createMockNext();

		jest.spyOn(ResponseObject, 'success').mockReturnValue({
			send: jest.fn(),
		} as any);

		(extractTokenFromRequest as jest.Mock).mockReturnValue('valid-jwt-token');
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('signup', () => {
		it('should create user successfully', async () => {
			const mockSignupResponse = {
				jwt: 'jwt-token',
				user: {
					id: '550e8400-e29b-41d4-a716-446655440000',
					username: 'testuser',
					email: 'test@example.com',
					phoneNumb: '+1234567890',
					isGoogleLogin: false,
					passwordHash: 'hashed-password',
					googleId: undefined,
					verifyToken: 123456,
					verifyTokenExpiry: new Date(),
					verified: false,
					role: 'user' as const,
					firstName: 'Test',
					lastName: 'User',
					country: 'US',
					isAvatarSelected: false,
					avatar: undefined,
					isProfileDeleted: false,
					currency: 0,
					pointsScored: 0,
					isProfileOpen: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};

			req.body = {
				username: 'testuser',
				email: 'test@example.com',
				password: 'password123',
				firstName: 'Test',
				lastName: 'User',
				phoneNumb: '+1234567890',
				country: 'US',
			};

			mockAuthService.signup.mockResolvedValue(mockSignupResponse);

			await LoginController.signup(req, res, next);

			expect(AuthService).toHaveBeenCalledWith(req.body);
			expect(mockAuthService.signup).toHaveBeenCalledTimes(1);
			expect(ResponseObject.success).toHaveBeenCalledWith(
				201,
				'User successfully created. A verification token has been sent to your email.',
				mockSignupResponse
			);
			expect(next).not.toHaveBeenCalled();
		});

		it('should handle signup validation errors', async () => {
			req.body = {
				username: 'testuser',
				// missing required fields
			};

			const validationError = new Error('Validation failed');
			mockAuthService.signup.mockRejectedValue(validationError);

			await LoginController.signup(req, res, next);

			expect(next).toHaveBeenCalledWith(validationError);
		});

		it('should handle service errors', async () => {
			req.body = {
				username: 'testuser',
				email: 'test@example.com',
				password: 'password123',
			};

			const serviceError = new Error('Email service unavailable');
			mockAuthService.signup.mockRejectedValue(serviceError);

			await LoginController.signup(req, res, next);

			expect(next).toHaveBeenCalledWith(serviceError);
		});

		it('should handle user already exists error', async () => {
			req.body = {
				username: 'existinguser',
				email: 'existing@example.com',
				password: 'password123',
			};

			const duplicateError = new Error('User already exists');
			mockAuthService.signup.mockRejectedValue(duplicateError);

			await LoginController.signup(req, res, next);

			expect(next).toHaveBeenCalledWith(duplicateError);
		});
	});

	describe('verifyOTP', () => {
		it('should verify OTP successfully', async () => {
			req.body = { otp: '123456' };
			(extractTokenFromRequest as jest.Mock).mockReturnValue('valid-jwt-token');
			mockAuthService.verifyOTP.mockResolvedValue();

			await LoginController.verifyOTP(req, res, next);

			expect(extractTokenFromRequest).toHaveBeenCalledWith(req);
			expect(AuthService).toHaveBeenCalledWith({});
			expect(mockAuthService.verifyOTP).toHaveBeenCalledWith('valid-jwt-token', 123456);
			expect(ResponseObject.success).toHaveBeenCalledWith(
				200,
				'Email verified successfully. Your account is now active.'
			);
			expect(next).not.toHaveBeenCalled();
		});

		it('should handle missing OTP', async () => {
			req.body = {};

			await LoginController.verifyOTP(req, res, next);

			expect(next).toHaveBeenCalledWith(new Error('OTP is required'));
		});

		it('should handle invalid OTP format', async () => {
			req.body = { otp: 'invalid-otp' };

			await LoginController.verifyOTP(req, res, next);

			expect(next).toHaveBeenCalledWith(new Error('Valid numeric OTP is required'));
		});

		it('should handle missing authorization token', async () => {
			req.body = { otp: '123456' };
			(extractTokenFromRequest as jest.Mock).mockReturnValue(null);

			await LoginController.verifyOTP(req, res, next);

			expect(next).toHaveBeenCalledWith(new Error('Authorization token is required'));
		});

		it('should handle service verification errors', async () => {
			req.body = { otp: '123456' };
			const verificationError = new Error('Invalid OTP');
			mockAuthService.verifyOTP.mockRejectedValue(verificationError);

			await LoginController.verifyOTP(req, res, next);

			expect(next).toHaveBeenCalledWith(verificationError);
		});

		it('should handle expired OTP', async () => {
			req.body = { otp: '123456' };
			const expiredError = new Error('OTP has expired');
			mockAuthService.verifyOTP.mockRejectedValue(expiredError);

			await LoginController.verifyOTP(req, res, next);

			expect(next).toHaveBeenCalledWith(expiredError);
		});

		it('should handle numeric OTP conversion', async () => {
			req.body = { otp: 123456 }; // numeric instead of string
			mockAuthService.verifyOTP.mockResolvedValue();

			await LoginController.verifyOTP(req, res, next);

			expect(mockAuthService.verifyOTP).toHaveBeenCalledWith('valid-jwt-token', 123456);
		});

		it('should handle zero OTP', async () => {
			req.body = { otp: '0' };
			mockAuthService.verifyOTP.mockResolvedValue();

			await LoginController.verifyOTP(req, res, next);

			expect(mockAuthService.verifyOTP).toHaveBeenCalledWith('valid-jwt-token', 0);
			expect(ResponseObject.success).toHaveBeenCalledWith(
				200,
				'Email verified successfully. Your account is now active.'
			);
		});
	});
});