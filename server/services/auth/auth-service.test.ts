import { AuthService } from './auth-service';
import { IUserRepository } from '../../repositories/login/login-repositories';
import { EmailService } from '../email/email-service';
import { RefreshTokenService } from './refresh-token-service';
import { createMockUser, createMockCreateUserInput } from '../../__tests__/utils/test-helpers';
import { CreateUserInput } from '../../models/user-model';
import { HttpError } from '../../types/common/error-types';
import * as authUtils from '../../utils/auth';

jest.mock('../../utils/auth');
jest.mock('../email/email-service');

describe('AuthService', () => {
	let authService: AuthService;
	let mockUserRepository: jest.Mocked<IUserRepository>;
	let mockEmailService: jest.Mocked<EmailService>;
	let mockRefreshTokenService: jest.Mocked<RefreshTokenService>;
	let mockUserInput: Partial<CreateUserInput>;

	beforeEach(() => {
		mockUserRepository = {
			checkIfUserExists: jest.fn(),
			checkUserExistence: jest.fn(),
			saveUser: jest.fn(),
			getUser: jest.fn(),
			updateUser: jest.fn(),
		};

		mockEmailService = {
			sendVerificationEmail: jest.fn(),
		} as any;

		mockRefreshTokenService = {
			createRefreshToken: jest.fn().mockResolvedValue('refresh-token-value'),
			refreshAccessToken: jest.fn(),
			revokeToken: jest.fn(),
			revokeAllUserTokens: jest.fn(),
		} as any;

		mockUserInput = createMockCreateUserInput();

		authService = new AuthService(
			mockUserInput,
			mockUserRepository,
			mockEmailService,
			mockRefreshTokenService
		);

		// Mock auth utility functions
		(authUtils.generateId as jest.Mock).mockReturnValue('550e8400-e29b-41d4-a716-446655440000');
		(authUtils.generateToken as jest.Mock).mockReturnValue({
			token: 123456,
			expiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
		});
		(authUtils.generateJWT as jest.Mock).mockReturnValue('jwt-token');
		(authUtils.generateRefreshToken as jest.Mock).mockReturnValue({
			token: 'refresh-token',
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		});
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('signup', () => {
		it('should create user successfully', async () => {
			const mockUser = createMockUser();
			mockUserRepository.checkUserExistence.mockResolvedValue({
				exists: false,
				message: 'User does not exist, can proceed with signup'
			});
			mockUserRepository.saveUser.mockResolvedValue(mockUser);
			mockEmailService.sendVerificationEmail.mockResolvedValue(undefined);

			const result = await authService.signup();

			expect(result).toEqual({
				jwt: 'jwt-token',
				refreshToken: 'refresh-token-value',
				user: expect.objectContaining({
					id: expect.any(String),
					username: mockUserInput.username,
					email: mockUserInput.email,
				}),
			});

			expect(mockUserRepository.checkUserExistence).toHaveBeenCalledWith(
				expect.objectContaining({
					email: mockUserInput.email,
					username: mockUserInput.username,
					phoneNumb: mockUserInput.phoneNumb
				}),
				'signup'
			);
			expect(mockUserRepository.saveUser).toHaveBeenCalled();
			expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
		});

		it('should throw error when user already exists by email', async () => {
			const existingUser = createMockUser();
			mockUserRepository.checkUserExistence.mockResolvedValue({
				exists: true,
				user: existingUser as any,
				message: 'User already exists with email'
			});

			await expect(authService.signup()).rejects.toThrow(HttpError);
		});

		it('should handle email service errors', async () => {
			const mockUser = createMockUser();
			mockUserRepository.checkUserExistence.mockResolvedValue({
				exists: false,
				message: 'User does not exist, can proceed with signup'
			});
			mockUserRepository.saveUser.mockResolvedValue(mockUser);
			mockEmailService.sendVerificationEmail.mockRejectedValue(
				new Error('Email service unavailable')
			);

			await expect(authService.signup()).rejects.toThrow('Email service unavailable');
		});

		it('should handle repository save errors', async () => {
			mockUserRepository.checkUserExistence.mockResolvedValue({
				exists: false,
				message: 'User does not exist, can proceed with signup'
			});
			mockUserRepository.saveUser.mockRejectedValue(
				new Error('Database constraint violation')
			);

			await expect(authService.signup()).rejects.toThrow('Database constraint violation');
		});

		it('should validate required fields', async () => {
			const invalidUserInput = { ...mockUserInput, email: undefined };
			const invalidAuthService = new AuthService(
				invalidUserInput,
				mockUserRepository,
				mockEmailService
			);

			await expect(invalidAuthService.signup()).rejects.toThrow();
		});
	});

	describe('verifyOTP', () => {
		it('should verify OTP successfully', async () => {
			const mockUser = createMockUser({
				verifyToken: 123456,
				verifyTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
				verified: false,
			});

			// Mock JWT extraction
			(authUtils.verifyJWT as jest.Mock).mockReturnValue({
				id: '550e8400-e29b-41d4-a716-446655440000',
				username: 'testuser',
				email: 'test@example.com',
				phoneNumb: '+1234567890',
				passwordHash: 'hashed-password',
				role: 'user',
			});

			mockUserRepository.getUser.mockResolvedValue(mockUser);
			mockUserRepository.updateUser.mockResolvedValue({
				...mockUser,
				verified: true,
				verifyToken: null as any,
				verifyTokenExpiry: null as any,
			});

			await expect(
				authService.verifyOTP('valid-jwt-token', 123456)
			).resolves.not.toThrow();

			expect(mockUserRepository.getUser).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
			expect(mockUserRepository.updateUser).toHaveBeenCalledWith({
				id: '550e8400-e29b-41d4-a716-446655440000',
				verified: true,
				verifyToken: undefined,
				verifyTokenExpiry: undefined,
			});
		});

		it('should throw error for invalid OTP', async () => {
			const mockUser = createMockUser({
				verifyToken: 123456,
				verifyTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
				verified: false,
			});

			(authUtils.verifyJWT as jest.Mock).mockReturnValue({
				id: '550e8400-e29b-41d4-a716-446655440000',
			});

			mockUserRepository.getUser.mockResolvedValue(mockUser);

			await expect(
				authService.verifyOTP('valid-jwt-token', 654321)
			).rejects.toThrow(HttpError);
		});

		it('should throw error for expired token', async () => {
			const mockUser = createMockUser({
				verifyToken: 123456,
				verifyTokenExpiry: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
				verified: false,
			});

			(authUtils.verifyJWT as jest.Mock).mockReturnValue({
				id: '550e8400-e29b-41d4-a716-446655440000',
			});

			mockUserRepository.getUser.mockResolvedValue(mockUser);

			await expect(
				authService.verifyOTP('valid-jwt-token', 123456)
			).rejects.toThrow(HttpError);
		});

		it('should throw error for already verified user', async () => {
			const mockUser = createMockUser({
				verified: true,
				verifyToken: null as any, // Already verified users have null verifyToken
			});

			(authUtils.verifyJWT as jest.Mock).mockReturnValue({
				id: '550e8400-e29b-41d4-a716-446655440000',
			});

			mockUserRepository.getUser.mockResolvedValue(mockUser);

			await expect(
				authService.verifyOTP('valid-jwt-token', 123456)
			).rejects.toThrow('No verification token found');
		});

		it('should throw error when user not found', async () => {
			(authUtils.verifyJWT as jest.Mock).mockReturnValue({
				id: 'nonexistent-user-id',
			});

			mockUserRepository.getUser.mockResolvedValue(null);

			await expect(
				authService.verifyOTP('valid-jwt-token', 123456)
			).rejects.toThrow(HttpError);
		});

		it('should handle invalid JWT', async () => {
			(authUtils.verifyJWT as jest.Mock).mockImplementation(() => {
				throw new Error('Invalid token');
			});

			await expect(
				authService.verifyOTP('invalid-jwt-token', 123456)
			).rejects.toThrow('Invalid token');
		});
	});

	describe('resendOTP', () => {
		beforeEach(() => {
			(authUtils.verifyJWT as jest.Mock).mockReturnValue({
				id: '550e8400-e29b-41d4-a716-446655440000',
				email: 'test@example.com',
				username: 'testuser',
				phoneNumb: '+1234567890',
			});
		});

		it('should resend OTP successfully for unverified user', async () => {
			const mockUser = createMockUser({
				verified: false,
				verifyToken: 123456,
				verifyTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
			});

			mockUserRepository.getUser.mockResolvedValue(mockUser);
			mockUserRepository.updateUser.mockResolvedValue(createMockUser());
			mockEmailService.sendVerificationEmail.mockResolvedValue(undefined);

			await authService.resendOTP('valid-jwt-token');

			expect(authUtils.verifyJWT).toHaveBeenCalledWith('valid-jwt-token');
			expect(mockUserRepository.getUser).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
			expect(authUtils.generateToken).toHaveBeenCalled();
			expect(mockUserRepository.updateUser).toHaveBeenCalledWith({
				id: mockUser.id,
				verifyToken: 123456,
				verifyTokenExpiry: expect.any(Date),
			});
			expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
				'test@example.com',
				123456
			);
		});

		it('should throw error for already verified user', async () => {
			const mockUser = createMockUser({
				verified: true,
				verifyToken: null as any,
			});

			mockUserRepository.getUser.mockResolvedValue(mockUser);

			await expect(
				authService.resendOTP('valid-jwt-token')
			).rejects.toThrow(new HttpError(400, 'Account is already verified'));

			expect(mockUserRepository.updateUser).not.toHaveBeenCalled();
			expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();
		});

		it('should throw error for invalid JWT token', async () => {
			(authUtils.verifyJWT as jest.Mock).mockImplementation(() => {
				throw new Error('Invalid token');
			});

			await expect(
				authService.resendOTP('invalid-token')
			).rejects.toThrow('Invalid token');

			expect(mockUserRepository.getUser).not.toHaveBeenCalled();
		});

		it('should throw error when user not found', async () => {
			mockUserRepository.getUser.mockResolvedValue(null);

			await expect(
				authService.resendOTP('valid-jwt-token')
			).rejects.toThrow(new HttpError(404, 'User not found'));

			expect(mockUserRepository.updateUser).not.toHaveBeenCalled();
			expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();
		});

		it('should throw error when email is missing from token payload', async () => {
			(authUtils.verifyJWT as jest.Mock).mockReturnValue({
				id: '550e8400-e29b-41d4-a716-446655440000',
				username: 'testuser',
				phoneNumb: '+1234567890',
				// email is missing
			});

			const mockUser = createMockUser({ verified: false });
			mockUserRepository.getUser.mockResolvedValue(mockUser);

			await expect(
				authService.resendOTP('valid-jwt-token')
			).rejects.toThrow(new HttpError(400, 'Email address is required for OTP resend'));

			expect(mockUserRepository.updateUser).toHaveBeenCalled(); // Update happens before email validation
			expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();
		});

		it('should handle email service failure', async () => {
			const mockUser = createMockUser({ verified: false });
			mockUserRepository.getUser.mockResolvedValue(mockUser);
			mockUserRepository.updateUser.mockResolvedValue(createMockUser());
			mockEmailService.sendVerificationEmail.mockRejectedValue(
				new Error('Email service unavailable')
			);

			await expect(
				authService.resendOTP('valid-jwt-token')
			).rejects.toThrow('Email service unavailable');

			expect(mockUserRepository.updateUser).toHaveBeenCalled();
		});

		it('should handle database update failure', async () => {
			const mockUser = createMockUser({ verified: false });
			mockUserRepository.getUser.mockResolvedValue(mockUser);
			mockUserRepository.updateUser.mockRejectedValue(
				new Error('Database connection failed')
			);

			await expect(
				authService.resendOTP('valid-jwt-token')
			).rejects.toThrow('Database connection failed');

			expect(mockEmailService.sendVerificationEmail).not.toHaveBeenCalled();
		});

		it('should generate new token with proper expiry', async () => {
			const mockUser = createMockUser({ verified: false });
			const mockNewToken = { token: 654321, expiry: new Date(Date.now() + 24 * 60 * 60 * 1000) };
			
			(authUtils.generateToken as jest.Mock).mockReturnValue(mockNewToken);
			mockUserRepository.getUser.mockResolvedValue(mockUser);
			mockUserRepository.updateUser.mockResolvedValue(createMockUser());
			mockEmailService.sendVerificationEmail.mockResolvedValue(undefined);

			await authService.resendOTP('valid-jwt-token');

			expect(mockUserRepository.updateUser).toHaveBeenCalledWith({
				id: mockUser.id,
				verifyToken: 654321,
				verifyTokenExpiry: mockNewToken.expiry,
			});
		});
	});

	describe('constructor', () => {
		it('should create service with provided dependencies', () => {
			const service = new AuthService(
				mockUserInput,
				mockUserRepository,
				mockEmailService
			);
			expect(service).toBeInstanceOf(AuthService);
		});

		it('should create service with default dependencies when none provided', () => {
			const service = new AuthService(mockUserInput);
			expect(service).toBeInstanceOf(AuthService);
		});
	});
});