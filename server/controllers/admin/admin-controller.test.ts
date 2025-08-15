import { AdminController } from './admin-controller';
import AdminService from '../../services/admin/admin-service';
import { ResponseObject } from '../../types/common/controller-types';
import { Request, Response, NextFunction } from 'express';
import { User } from '../../generated/prisma';
import { HttpError } from '../../types/common/error-types';

jest.mock('../../services/admin/admin-service');

describe('AdminController', () => {
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let mockNext: NextFunction;
	let mockSend: jest.Mock;

	const mockUser: User = {
		id: '1',
		username: 'testuser',
		email: 'test@example.com',
		phoneNumb: '+1234567890',
		isGoogleLogin: false,
		passwordHash: 'hashedpassword',
		googleId: null,
		verifyToken: 123456,
		verifyTokenExpiry: new Date(),
		verified: true,
		role: 'user',
		firstName: 'John',
		lastName: 'Doe',
		country: 'US',
		isAvatarSelected: false,
		avatar: null,
		isProfileDeleted: false,
		currency: 0,
		pointsScored: 0,
		isProfileOpen: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(() => {
		mockSend = jest.fn();
		mockRequest = {};
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

	describe('whoami', () => {
		it('should return success response with Hello Admin message', async () => {
			await AdminController.whoami(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockSend).toHaveBeenCalledWith(mockResponse);
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should call next with error if exception occurs', async () => {
			const error = new Error('Unexpected error');
			mockSend.mockImplementation(() => {
				throw error;
			});

			await AdminController.whoami(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});
	});

	describe('getAllUsers', () => {
		it('should return all users successfully', async () => {
			const mockUsers = [mockUser, { ...mockUser, id: '2', username: 'user2' }];
			(AdminService.getAllUsers as jest.Mock).mockResolvedValue(mockUsers);

			await AdminController.getAllUsers(mockRequest as Request, mockResponse as Response, mockNext);

			expect(AdminService.getAllUsers).toHaveBeenCalledTimes(1);
			expect(mockSend).toHaveBeenCalledWith(mockResponse);
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should call next with error when service throws error', async () => {
			const error = new HttpError(404, 'No users found');
			(AdminService.getAllUsers as jest.Mock).mockRejectedValue(error);

			await AdminController.getAllUsers(mockRequest as Request, mockResponse as Response, mockNext);

			expect(AdminService.getAllUsers).toHaveBeenCalledTimes(1);
			expect(mockSend).not.toHaveBeenCalled();
			expect(mockNext).toHaveBeenCalledWith(error);
		});

		it('should handle database connection errors', async () => {
			const error = new Error('Database connection failed');
			(AdminService.getAllUsers as jest.Mock).mockRejectedValue(error);

			await AdminController.getAllUsers(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});
	});

	describe('getUser', () => {
		it('should return user when found', async () => {
			const userId = '1';
			mockRequest.params = { id: userId };
			(AdminService.getUser as jest.Mock).mockResolvedValue(mockUser);

			await AdminController.getUser(mockRequest as Request, mockResponse as Response, mockNext);

			expect(AdminService.getUser).toHaveBeenCalledWith(userId);
			expect(mockSend).toHaveBeenCalledWith(mockResponse);
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should call next with error when user not found', async () => {
			const userId = 'non-existent';
			mockRequest.params = { id: userId };
			const error = new HttpError(404, 'User not found');
			(AdminService.getUser as jest.Mock).mockRejectedValue(error);

			await AdminController.getUser(mockRequest as Request, mockResponse as Response, mockNext);

			expect(AdminService.getUser).toHaveBeenCalledWith(userId);
			expect(mockSend).not.toHaveBeenCalled();
			expect(mockNext).toHaveBeenCalledWith(error);
		});

		it('should handle missing id parameter', async () => {
			mockRequest.params = {};
			(AdminService.getUser as jest.Mock).mockResolvedValue(mockUser);

			await AdminController.getUser(mockRequest as Request, mockResponse as Response, mockNext);

			expect(AdminService.getUser).toHaveBeenCalledWith(undefined);
		});

		it('should handle service errors', async () => {
			const userId = '1';
			mockRequest.params = { id: userId };
			const error = new Error('Database error');
			(AdminService.getUser as jest.Mock).mockRejectedValue(error);

			await AdminController.getUser(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});
	});

	describe('deleteUser', () => {
		it('should delete user successfully', async () => {
			const userId = '1';
			mockRequest.params = { id: userId };
			(AdminService.deleteUser as jest.Mock).mockResolvedValue(mockUser);

			await AdminController.deleteUser(mockRequest as Request, mockResponse as Response, mockNext);

			expect(AdminService.deleteUser).toHaveBeenCalledWith(userId);
			expect(mockSend).toHaveBeenCalledWith(mockResponse);
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should call next with error when user not found for deletion', async () => {
			const userId = 'non-existent';
			mockRequest.params = { id: userId };
			const error = new HttpError(404, 'User not found');
			(AdminService.deleteUser as jest.Mock).mockRejectedValue(error);

			await AdminController.deleteUser(mockRequest as Request, mockResponse as Response, mockNext);

			expect(AdminService.deleteUser).toHaveBeenCalledWith(userId);
			expect(mockSend).not.toHaveBeenCalled();
			expect(mockNext).toHaveBeenCalledWith(error);
		});

		it('should handle missing id parameter for deletion', async () => {
			mockRequest.params = {};
			(AdminService.deleteUser as jest.Mock).mockResolvedValue(mockUser);

			await AdminController.deleteUser(mockRequest as Request, mockResponse as Response, mockNext);

			expect(AdminService.deleteUser).toHaveBeenCalledWith(undefined);
		});

		it('should handle service errors during deletion', async () => {
			const userId = '1';
			mockRequest.params = { id: userId };
			const error = new Error('Failed to delete user');
			(AdminService.deleteUser as jest.Mock).mockRejectedValue(error);

			await AdminController.deleteUser(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});

		it('should handle database constraint errors', async () => {
			const userId = '1';
			mockRequest.params = { id: userId };
			const error = new Error('Cannot delete user with active sessions');
			(AdminService.deleteUser as jest.Mock).mockRejectedValue(error);

			await AdminController.deleteUser(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});
	});

	describe('error handling', () => {
		it('should handle unexpected errors in whoami', async () => {
			const error = new Error('Unexpected system error');
			jest.spyOn(ResponseObject, 'success').mockImplementation(() => {
				throw error;
			});

			await AdminController.whoami(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});

		it('should handle ResponseObject creation errors', async () => {
			const error = new Error('Invalid response object');
			(AdminService.getAllUsers as jest.Mock).mockResolvedValue([mockUser]);
			jest.spyOn(ResponseObject, 'success').mockImplementation(() => {
				throw error;
			});

			await AdminController.getAllUsers(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(error);
		});
	});

	describe('edge cases', () => {
		it('should handle null params object', async () => {
			mockRequest.params = null as any;

			await AdminController.getUser(mockRequest as Request, mockResponse as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(expect.any(TypeError));
		});

		it('should handle empty string id', async () => {
			mockRequest.params = { id: '' };
			(AdminService.getUser as jest.Mock).mockResolvedValue(mockUser);

			await AdminController.getUser(mockRequest as Request, mockResponse as Response, mockNext);

			expect(AdminService.getUser).toHaveBeenCalledWith('');
		});

		it('should handle malformed request object', async () => {
			const malformedRequest = {} as Request;
			(AdminService.getAllUsers as jest.Mock).mockResolvedValue([mockUser]);

			await AdminController.getAllUsers(malformedRequest, mockResponse as Response, mockNext);

			expect(AdminService.getAllUsers).toHaveBeenCalled();
		});
	});
});