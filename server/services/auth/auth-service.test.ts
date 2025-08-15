import { AuthService } from './auth-service';
import { IUserRepository } from '../../repositories/login-repositories';
import { EmailService } from '../email/email-service';
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
	let mockUserInput: Partial<CreateUserInput>;

	beforeEach(() => {
		mockUserRepository = {
			checkIfUserExists: jest.fn(),
			saveUser: jest.fn(),
			getUser: jest.fn(),
			updateUser: jest.fn(),
		};

		mockEmailService = {
			sendVerificationEmail: jest.fn(),
		} as any;

		mockUserInput = createMockCreateUserInput();

		authService = new AuthService(
			mockUserInput,
			mockUserRepository,
			mockEmailService
		);

		// Mock auth utility functions
		(authUtils.generateId as jest.Mock).mockReturnValue('550e8400-e29b-41d4-a716-446655440000');
		(authUtils.generateToken as jest.Mock).mockReturnValue({
			token: 123456,
			expiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
		});
		(authUtils.generateJWT as jest.Mock).mockReturnValue('jwt-token');
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('signup', () => {
		it('should create user successfully', async () => {
			const mockUser = createMockUser();
			mockUserRepository.checkIfUserExists.mockResolvedValue(null);
			mockUserRepository.saveUser.mockResolvedValue(mockUser);
			mockEmailService.sendVerificationEmail.mockResolvedValue();

			const result = await authService.signup();

			expect(result).toEqual({
				jwt: 'jwt-token',
				user: expect.objectContaining({
					id: expect.any(String),
					username: mockUserInput.username,
					email: mockUserInput.email,
				}),
			});

			expect(mockUserRepository.checkIfUserExists).toHaveBeenCalled();
			expect(mockUserRepository.saveUser).toHaveBeenCalled();
			expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
		});

		it('should throw error when user already exists by email', async () => {
			const existingUser = createMockUser();
			mockUserRepository.checkIfUserExists.mockResolvedValue(existingUser);

			await expect(authService.signup()).rejects.toThrow(HttpError);
		});

		it('should handle email service errors', async () => {
			const mockUser = createMockUser();
			mockUserRepository.checkIfUserExists.mockResolvedValue(null);
			mockUserRepository.saveUser.mockResolvedValue(mockUser);
			mockEmailService.sendVerificationEmail.mockRejectedValue(
				new Error('Email service unavailable')
			);

			await expect(authService.signup()).rejects.toThrow('Email service unavailable');
		});

		it('should handle repository save errors', async () => {
			mockUserRepository.checkIfUserExists.mockResolvedValue(null);
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