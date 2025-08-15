import { LoginController } from './login-controller';
import { AuthService } from '../../services/auth/auth-service';
import { ResponseObject } from '../../types/common/controller-types';
import { extractTokenFromRequest } from '../../middlewares/auth-middleware';
import { Request, Response, NextFunction } from 'express';
import { CreateUserResponseType } from '../../types/dto/user-types';

jest.mock('../../services/auth/auth-service');
jest.mock('../../middlewares/auth-middleware');

describe('LoginController', () => {
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let mockNext: NextFunction;
	let mockSend: jest.Mock;

	const mockUserResponse: CreateUserResponseType = {
		jwt: 'mock-jwt-token',
		user: {
			id: '1',
			username: 'testuser',
			email: 'test@example.com',
			phoneNumb: '+1234567890',
			isGoogleLogin: false,
			passwordHash: 'hashedpassword',
			googleId: undefined,
			verifyToken: 123456,
			verifyTokenExpiry: new Date(Date.now() + 10 * 60 * 1000),
			verified: false,
			role: 'user',
			firstName: 'John',
			lastName: 'Doe',
			country: 'US',
			isAvatarSelected: false,
			avatar: undefined,
			isProfileDeleted: false,
			currency: 0,
			pointsScored: 0,
			isProfileOpen: true,
		},
	};

	beforeEach(() => {
		mockSend = jest.fn();
		mockRequest = {
			body: {},
			headers: {},
		};
		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
		};
		mockNext = jest.fn();
		jest.clearAllMocks();

		// Mock ResponseObject.send method
		jest.spyOn(ResponseObject.prototype, 'send').mockImplementation(mockSend);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('signup', () => {
		it('should successfully create a new user', async () => {
			const signupData = {
				username: 'testuser',
				email: 'test@example.com',
				password: 'password123',
				firstName: 'John',
				lastName: 'Doe',
			};
			mockRequest.body = signupData;

			const mockAuthService = {
				signup: jest.fn().mockResolvedValue(mockUserResponse),
			};
			(AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService as any);

			await LoginController.signup(mockRequest as Request, mockResponse as Response, mockNext);

			expect(AuthService).toHaveBeenCalledWith(signupData);
			expect(mockAuthService.signup).toHaveBeenCalledTimes(1);
			expect(mockSend).toHaveBeenCalledWith(mockResponse);
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should handle signup errors', async () => {
			const signupData = {
				username: 'testuser',
				email: 'test@example.com',
				password: 'password123',
			};
			mockRequest.body = signupData;

			const error = new Error('User already exists');
			const mockAuthService = {
				signup: jest.fn().mockRejectedValue(error),
			};
			(AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService as any);

			await LoginController.signup(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
			expect(mockSend).not.toHaveBeenCalled();
		});

		it('should handle validation errors', async () => {
			const invalidSignupData = {
				username: '',
				email: 'invalid-email',
			};
			mockRequest.body = invalidSignupData;

			const validationError = new Error('Validation failed');
			const mockAuthService = {
				signup: jest.fn().mockRejectedValue(validationError),
			};
			(AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService as any);

			await LoginController.signup(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(validationError);
		});

		it('should handle empty request body', async () => {
			mockRequest.body = {};

			const mockAuthService = {
				signup: jest.fn().mockResolvedValue(mockUserResponse),
			};
			(AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService as any);

			await LoginController.signup(mockRequest as Request, mockResponse as Response, mockNext);

			expect(AuthService).toHaveBeenCalledWith({});
			expect(mockAuthService.signup).toHaveBeenCalled();
		});

		it('should handle service instantiation errors', async () => {
			const signupData = { username: 'test' };
			mockRequest.body = signupData;

			const instantiationError = new Error('Service initialization failed');
			(AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => {
				throw instantiationError;
			});

			await LoginController.signup(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(instantiationError);
		});
	});

	describe('verifyOTP', () => {
		const validOTP = '123456';
		const validToken = 'valid-jwt-token';

		beforeEach(() => {
			(extractTokenFromRequest as jest.Mock).mockReturnValue(validToken);
		});

		it('should successfully verify OTP', async () => {
			mockRequest.body = { otp: validOTP };

			const mockAuthService = {
				verifyOTP: jest.fn().mockResolvedValue(undefined),
			};
			(AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService as any);

			await LoginController.verifyOTP(mockRequest as Request, mockResponse as Response, mockNext);

			expect(extractTokenFromRequest).toHaveBeenCalledWith(mockRequest);
			expect(AuthService).toHaveBeenCalledWith({});
			expect(mockAuthService.verifyOTP).toHaveBeenCalledWith(validToken, 123456);
			expect(mockSend).toHaveBeenCalledWith(mockResponse);
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should return error when OTP is missing', async () => {
			mockRequest.body = {};

			await LoginController.verifyOTP(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(new Error('OTP is required'));
			expect(mockSend).not.toHaveBeenCalled();
		});

		it('should return error when OTP is empty string', async () => {
			mockRequest.body = { otp: '' };

			await LoginController.verifyOTP(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(new Error('OTP is required'));
		});

		it('should return error when OTP is not numeric', async () => {
			mockRequest.body = { otp: 'invalid-otp' };

			await LoginController.verifyOTP(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(new Error('Valid numeric OTP is required'));
		});

		it('should return error when OTP contains non-numeric characters', async () => {
			mockRequest.body = { otp: 'abc123' };
			(extractTokenFromRequest as jest.Mock).mockReturnValue(validToken);

			await LoginController.verifyOTP(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(new Error('Valid numeric OTP is required'));
		});

		it('should return error when authorization token is missing', async () => {
			mockRequest.body = { otp: validOTP };
			(extractTokenFromRequest as jest.Mock).mockReturnValue(null);

			await LoginController.verifyOTP(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(new Error('Authorization token is required'));
			expect(mockSend).not.toHaveBeenCalled();
		});

		it('should handle service verification errors', async () => {
			mockRequest.body = { otp: validOTP };

			const verificationError = new Error('Invalid OTP');
			const mockAuthService = {
				verifyOTP: jest.fn().mockRejectedValue(verificationError),
			};
			(AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService as any);

			await LoginController.verifyOTP(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(verificationError);
			expect(mockSend).not.toHaveBeenCalled();
		});

		it('should handle expired OTP errors', async () => {
			mockRequest.body = { otp: validOTP };

			const expiredOTPError = new Error('OTP has expired');
			const mockAuthService = {
				verifyOTP: jest.fn().mockRejectedValue(expiredOTPError),
			};
			(AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService as any);

			await LoginController.verifyOTP(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(expiredOTPError);
		});

		it('should handle user not found errors', async () => {
			mockRequest.body = { otp: validOTP };

			const userNotFoundError = new Error('User not found');
			const mockAuthService = {
				verifyOTP: jest.fn().mockRejectedValue(userNotFoundError),
			};
			(AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService as any);

			await LoginController.verifyOTP(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(userNotFoundError);
		});

		it('should handle token extraction errors', async () => {
			mockRequest.body = { otp: validOTP };
			const tokenError = new Error('Invalid token format');
			(extractTokenFromRequest as jest.Mock).mockImplementation(() => {
				throw tokenError;
			});

			await LoginController.verifyOTP(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(tokenError);
		});
	});

	describe('edge cases', () => {
		it('should handle null request body in signup', async () => {
			mockRequest.body = null;

			const mockAuthService = {
				signup: jest.fn().mockResolvedValue(mockUserResponse),
			};
			(AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService as any);

			await LoginController.signup(mockRequest as Request, mockResponse as Response, mockNext);

			expect(AuthService).toHaveBeenCalledWith(null);
		});

		it('should handle null request body in verifyOTP', async () => {
			mockRequest.body = null;

			await LoginController.verifyOTP(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(expect.any(TypeError));
		});

		it('should handle numeric OTP as number type', async () => {
			const testToken = 'test-jwt-token';
			mockRequest.body = { otp: 123456 };
			(extractTokenFromRequest as jest.Mock).mockReturnValue(testToken);

			const mockAuthService = {
				verifyOTP: jest.fn().mockResolvedValue(undefined),
			};
			(AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService as any);

			await LoginController.verifyOTP(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockAuthService.verifyOTP).toHaveBeenCalledWith(testToken, 123456);
		});

		it('should handle zero OTP', async () => {
			const testToken = 'test-jwt-token';
			mockRequest.body = { otp: '0' };
			(extractTokenFromRequest as jest.Mock).mockReturnValue(testToken);

			const mockAuthService = {
				verifyOTP: jest.fn().mockResolvedValue(undefined),
			};
			(AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService as any);

			await LoginController.verifyOTP(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockAuthService.verifyOTP).toHaveBeenCalledWith(testToken, 0);
		});
	});
});