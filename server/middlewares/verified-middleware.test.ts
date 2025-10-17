import { Response, NextFunction } from 'express';
import { VerifiedMiddleware } from './verified-middleware';
import { AuthRequest } from './auth-middleware';
import { UserRepository } from '../repositories/login/login-repositories';
import {
	createMockRequest,
	createMockResponse,
	createMockNext,
	createMockUser
} from '../__tests__/utils/test-helpers';

jest.mock('../repositories/login/login-repositories');

describe('VerifiedMiddleware', () => {
	let mockRequest: AuthRequest;
	let mockResponse: Response;
	let mockNext: NextFunction;
	let mockUserRepository: jest.Mocked<UserRepository>;

	beforeEach(() => {
		mockRequest = createMockRequest() as AuthRequest;
		mockResponse = createMockResponse();
		mockNext = createMockNext();
		mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
		(UserRepository as jest.Mock).mockImplementation(() => mockUserRepository);
		jest.clearAllMocks();
	});

	describe('Authentication checks', () => {
		it('should return 401 error when userId is not provided', async () => {
			mockRequest.userId = undefined;

			await VerifiedMiddleware(mockRequest, mockResponse, mockNext);

			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 401,
					message: 'User authentication required'
				})
			);
		});

		it('should return 401 error when userId is null', async () => {
			mockRequest.userId = null as any;

			await VerifiedMiddleware(mockRequest, mockResponse, mockNext);

			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 401,
					message: 'User authentication required'
				})
			);
		});

		it('should return 401 error when userId is empty string', async () => {
			mockRequest.userId = '';

			await VerifiedMiddleware(mockRequest, mockResponse, mockNext);

			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 401,
					message: 'User authentication required'
				})
			);
		});
	});

	describe('User existence checks', () => {
		beforeEach(() => {
			mockRequest.userId = 'test-user-id';
		});

		it('should return 404 error when user does not exist', async () => {
			mockUserRepository.getUser.mockResolvedValue(null);

			await VerifiedMiddleware(mockRequest, mockResponse, mockNext);

			expect(mockUserRepository.getUser).toHaveBeenCalledWith('test-user-id');
			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 404,
					message: 'User not found'
				})
			);
		});
	});

	describe('Verification status checks', () => {
		beforeEach(() => {
			mockRequest.userId = 'test-user-id';
		});

		it('should return 403 error when user is not verified', async () => {
			const unverifiedUser = createMockUser({ verified: false });
			mockUserRepository.getUser.mockResolvedValue(unverifiedUser);

			await VerifiedMiddleware(mockRequest, mockResponse, mockNext);

			expect(mockUserRepository.getUser).toHaveBeenCalledWith('test-user-id');
			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 403,
					message: 'Account verification required'
				})
			);
		});

		it('should call next() when user is verified', async () => {
			const verifiedUser = createMockUser({ verified: true });
			mockUserRepository.getUser.mockResolvedValue(verifiedUser);

			await VerifiedMiddleware(mockRequest, mockResponse, mockNext);

			expect(mockUserRepository.getUser).toHaveBeenCalledWith('test-user-id');
			expect(mockNext).toHaveBeenCalledWith();
		});
	});

	describe('Error handling', () => {
		beforeEach(() => {
			mockRequest.userId = 'test-user-id';
		});

		it('should handle database errors gracefully', async () => {
			mockUserRepository.getUser.mockRejectedValue(new Error('Database error'));

			await VerifiedMiddleware(mockRequest, mockResponse, mockNext);

			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 500,
					message: 'Verification check failed'
				})
			);
		});

		it('should handle repository instantiation errors', async () => {
			(UserRepository as jest.Mock).mockImplementation(() => {
				throw new Error('Repository error');
			});

			await VerifiedMiddleware(mockRequest, mockResponse, mockNext);

			expect(mockNext).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 500,
					message: 'Verification check failed'
				})
			);
		});
	});
});

