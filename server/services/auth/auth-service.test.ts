import { AuthService } from './auth-service';
import { UserRepository } from '../../repositories/login-repositories';
import { EmailService } from '../email/email-service';
import { HttpError } from '../../types/common/error-types';
import { CreateUserInput } from '../../models/user-model';
import { UserType } from '../../types/dto/user-types';
import * as authUtils from '../../utils/auth';
import * as requestValidator from '../../utils/request-validator';

jest.mock('../../repositories/login-repositories');
jest.mock('../email/email-service');
jest.mock('../../utils/auth');
jest.mock('../../utils/request-validator');

describe('AuthService', () => {
	let authService: AuthService;
	let mockUserRepository: jest.Mocked<UserRepository>;
	let mockEmailService: jest.Mocked<EmailService>;

	const mockUserInput: Partial<CreateUserInput> = {
		username: 'testuser',
		email: 'test@example.com',
		phoneNumb: '+1234567890',
		firstName: 'John',
		lastName: 'Doe',
		country: 'US',
		passwordHash: 'plainpassword',
	};

	const mockUser: UserType = {
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
	};

	beforeEach(() => {
		jest.clearAllMocks();
		
		mockUserRepository = {
			checkIfUserExists: jest.fn(),
			saveUser: jest.fn(),
			getUser: jest.fn(),
			updateUser: jest.fn(),
		} as jest.Mocked<UserRepository>;

		mockEmailService = {
			sendVerificationEmail: jest.fn(),
		} as any;

		(authUtils.generateId as jest.Mock).mockReturnValue('generated-id');
		(authUtils.generateToken as jest.Mock).mockReturnValue({
			token: 123456,
			expiry: new Date(Date.now() + 10 * 60 * 1000),
		});
		(authUtils.encryptPassword as jest.Mock).mockReturnValue('hashedpassword');
		(authUtils.generateJWT as jest.Mock).mockReturnValue('mock-jwt-token');
		(authUtils.verifyJWT as jest.Mock).mockReturnValue({
			id: '1',
			username: 'testuser',
			email: 'test@example.com',
			phoneNumb: '+1234567890',
		});
		(requestValidator.validateSignup as jest.Mock).mockImplementation(() => {});

		authService = new AuthService(mockUserInput, mockUserRepository, mockEmailService);
	});

	describe('signup', () => {
		it('should successfully signup a new user', async () => {
			mockUserRepository.checkIfUserExists.mockResolvedValue(null);
			mockUserRepository.saveUser.mockResolvedValue(mockUser as any);

			const result = await authService.signup();

			expect(requestValidator.validateSignup).toHaveBeenCalled();
			expect(mockUserRepository.checkIfUserExists).toHaveBeenCalled();
			expect(mockUserRepository.saveUser).toHaveBeenCalled();
			expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
			expect(result).toHaveProperty('jwt');
			expect(result).toHaveProperty('user');
		});

		it('should throw error if user already exists', async () => {
			mockUserRepository.checkIfUserExists.mockResolvedValue(mockUser as any);

			await expect(authService.signup()).rejects.toThrow(HttpError);
			await expect(authService.signup()).rejects.toThrow('User already exists');
		});

		it('should handle validation errors', async () => {
			const validationError = new Error('Validation failed');
			(requestValidator.validateSignup as jest.Mock).mockImplementation(() => {
				throw validationError;
			});

			await expect(authService.signup()).rejects.toThrow(validationError);
		});

		it('should handle repository errors during user check', async () => {
			const repoError = new Error('Database connection failed');
			mockUserRepository.checkIfUserExists.mockRejectedValue(repoError);

			await expect(authService.signup()).rejects.toThrow(repoError);
		});

		it('should handle repository errors during user save', async () => {
			mockUserRepository.checkIfUserExists.mockResolvedValue(null);
			const saveError = new Error('Failed to save user');
			mockUserRepository.saveUser.mockRejectedValue(saveError);

			await expect(authService.signup()).rejects.toThrow(saveError);
		});

		it('should handle email service errors', async () => {
			mockUserRepository.checkIfUserExists.mockResolvedValue(null);
			mockUserRepository.saveUser.mockResolvedValue(mockUser as any);
			const emailError = new Error('Failed to send email');
			mockEmailService.sendVerificationEmail.mockRejectedValue(emailError);

			await expect(authService.signup()).rejects.toThrow(emailError);
		});
	});

	describe('verifyOTP', () => {
		const validToken = 'valid-jwt-token';
		const validOTP = 123456;

		beforeEach(() => {
			const futureDate = new Date(Date.now() + 10 * 60 * 1000);
			const mockUserWithToken = {
				...mockUser,
				verifyToken: validOTP,
				verifyTokenExpiry: futureDate,
			};
			mockUserRepository.getUser.mockResolvedValue(mockUserWithToken as any);
		});

		it('should successfully verify OTP', async () => {
			await authService.verifyOTP(validToken, validOTP);

			expect(authUtils.verifyJWT).toHaveBeenCalledWith(validToken);
			expect(mockUserRepository.getUser).toHaveBeenCalledWith('1');
			expect(mockUserRepository.updateUser).toHaveBeenCalledWith({
				id: '1',
				verified: true,
				verifyToken: undefined,
				verifyTokenExpiry: undefined,
			});
		});

		it('should throw error if user not found', async () => {
			mockUserRepository.getUser.mockResolvedValue(null);

			await expect(authService.verifyOTP(validToken, validOTP)).rejects.toThrow(HttpError);
			await expect(authService.verifyOTP(validToken, validOTP)).rejects.toThrow('User not found');
		});

		it('should throw error if OTP is invalid', async () => {
			const invalidOTP = 654321;

			await expect(authService.verifyOTP(validToken, invalidOTP)).rejects.toThrow(HttpError);
			await expect(authService.verifyOTP(validToken, invalidOTP)).rejects.toThrow('Invalid OTP');
		});

		it('should throw error if OTP has expired', async () => {
			const expiredDate = new Date(Date.now() - 10 * 60 * 1000);
			const mockUserWithExpiredToken = {
				...mockUser,
				verifyToken: validOTP,
				verifyTokenExpiry: expiredDate,
			};
			mockUserRepository.getUser.mockResolvedValue(mockUserWithExpiredToken as any);

			await expect(authService.verifyOTP(validToken, validOTP)).rejects.toThrow(HttpError);
			await expect(authService.verifyOTP(validToken, validOTP)).rejects.toThrow('OTP has expired');
		});

		it('should throw error if no verification token found', async () => {
			const mockUserWithoutToken = {
				...mockUser,
				verifyToken: null,
			};
			mockUserRepository.getUser.mockResolvedValue(mockUserWithoutToken as any);

			await expect(authService.verifyOTP(validToken, validOTP)).rejects.toThrow(HttpError);
			await expect(authService.verifyOTP(validToken, validOTP)).rejects.toThrow('No verification token found');
		});

		it('should handle JWT verification errors', async () => {
			const jwtError = new Error('Invalid token');
			(authUtils.verifyJWT as jest.Mock).mockImplementation(() => {
				throw jwtError;
			});

			await expect(authService.verifyOTP(validToken, validOTP)).rejects.toThrow(jwtError);
		});

		it('should handle repository errors during user update', async () => {
			const updateError = new Error('Failed to update user');
			mockUserRepository.updateUser.mockRejectedValue(updateError);

			await expect(authService.verifyOTP(validToken, validOTP)).rejects.toThrow(updateError);
		});
	});

	describe('constructor', () => {
		it('should use provided dependencies', () => {
			const service = new AuthService(mockUserInput, mockUserRepository, mockEmailService);
			expect(service).toBeInstanceOf(AuthService);
		});

		it('should use default dependencies when not provided', () => {
			const service = new AuthService(mockUserInput);
			expect(service).toBeInstanceOf(AuthService);
		});
	});

	describe('edge cases', () => {
		it('should handle empty user input', async () => {
			const emptyAuthService = new AuthService({}, mockUserRepository, mockEmailService);
			
			await expect(emptyAuthService.signup()).rejects.toThrow();
		});

		it('should handle null/undefined OTP', async () => {
			const validToken = 'valid-jwt-token';
			const mockUserWithToken = {
				...mockUser,
				verifyToken: 123456,
				verifyTokenExpiry: new Date(Date.now() + 10 * 60 * 1000),
			};
			mockUserRepository.getUser.mockResolvedValue(mockUserWithToken as any);
			
			await expect(authService.verifyOTP(validToken, null as any)).rejects.toThrow(HttpError);
			await expect(authService.verifyOTP(validToken, null as any)).rejects.toThrow('OTP is required');
		});

		it('should handle missing user ID during save', async () => {
			(authUtils.generateId as jest.Mock).mockReturnValue(undefined);
			
			const serviceWithUndefinedId = new AuthService(mockUserInput, mockUserRepository, mockEmailService);
			mockUserRepository.checkIfUserExists.mockResolvedValue(null);
			
			await expect(serviceWithUndefinedId.signup()).rejects.toThrow(HttpError);
			await expect(serviceWithUndefinedId.signup()).rejects.toThrow('User ID is required');
		});
	});
});