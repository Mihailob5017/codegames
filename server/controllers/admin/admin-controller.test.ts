import { AdminController } from './admin-controller';
import { AdminService } from '../../services/admin/admin-service';
import { ResponseObject } from '../../types/common/controller-types';
import { createMockRequest, createMockResponse, createMockNext, createMockUser } from '../../__tests__/utils/test-helpers';

jest.mock('../../services/admin/admin-service');

describe('AdminController', () => {
	let mockAdminService: jest.Mocked<AdminService>;
	let req: any;
	let res: any;
	let next: any;

	beforeEach(() => {
		mockAdminService = {
			getAllUsers: jest.fn(),
			getUser: jest.fn(),
			deleteUser: jest.fn(),
		} as any;

		(AdminService as jest.MockedClass<typeof AdminService>).mockImplementation(() => mockAdminService);

		req = createMockRequest();
		res = createMockResponse();
		next = createMockNext();

		jest.spyOn(ResponseObject, 'success').mockReturnValue({
			send: jest.fn(),
		} as any);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('whoami', () => {
		it('should return hello admin message', async () => {
			await AdminController.whoami(req, res, next);

			expect(ResponseObject.success).toHaveBeenCalledWith(200, 'Hello Admin');
			expect(next).not.toHaveBeenCalled();
		});

		it('should handle errors', async () => {
			const error = new Error('Test error');
			jest.spyOn(ResponseObject, 'success').mockImplementation(() => {
				throw error;
			});

			await AdminController.whoami(req, res, next);

			expect(next).toHaveBeenCalledWith(error);
		});
	});

	describe('getAllUsers', () => {
		it('should return all users successfully', async () => {
			const mockUsers = [
				createMockUser({ id: 'user-1' }),
				createMockUser({ id: 'user-2' }),
			];
			mockAdminService.getAllUsers.mockResolvedValue(mockUsers);

			await AdminController.getAllUsers(req, res, next);

			expect(mockAdminService.getAllUsers).toHaveBeenCalledTimes(1);
			expect(ResponseObject.success).toHaveBeenCalledWith(200, 'All users', mockUsers);
			expect(next).not.toHaveBeenCalled();
		});

		it('should handle service errors', async () => {
			const serviceError = new Error('Service error');
			mockAdminService.getAllUsers.mockRejectedValue(serviceError);

			await AdminController.getAllUsers(req, res, next);

			expect(next).toHaveBeenCalledWith(serviceError);
		});
	});

	describe('getUser', () => {
		it('should return user when found', async () => {
			const mockUser = createMockUser();
			req.params = { id: 'test-user-id' };
			mockAdminService.getUser.mockResolvedValue(mockUser);

			await AdminController.getUser(req, res, next);

			expect(mockAdminService.getUser).toHaveBeenCalledWith('test-user-id');
			expect(ResponseObject.success).toHaveBeenCalledWith(200, 'User found', mockUser);
			expect(next).not.toHaveBeenCalled();
		});

		it('should handle user not found', async () => {
			req.params = { id: 'nonexistent-id' };
			const serviceError = new Error('User not found');
			mockAdminService.getUser.mockRejectedValue(serviceError);

			await AdminController.getUser(req, res, next);

			expect(next).toHaveBeenCalledWith(serviceError);
		});

		it('should handle missing user id', async () => {
			req.params = {};
			const serviceError = new Error('User ID is required');
			mockAdminService.getUser.mockRejectedValue(serviceError);

			await AdminController.getUser(req, res, next);

			expect(next).toHaveBeenCalledWith(serviceError);
		});

		it('should handle service errors', async () => {
			req.params = { id: 'test-user-id' };
			const serviceError = new Error('Database connection failed');
			mockAdminService.getUser.mockRejectedValue(serviceError);

			await AdminController.getUser(req, res, next);

			expect(next).toHaveBeenCalledWith(serviceError);
		});
	});

	describe('deleteUser', () => {
		it('should delete user successfully', async () => {
			const mockUser = createMockUser();
			req.params = { id: 'test-user-id' };
			mockAdminService.deleteUser.mockResolvedValue(mockUser);

			await AdminController.deleteUser(req, res, next);

			expect(mockAdminService.deleteUser).toHaveBeenCalledWith('test-user-id');
			expect(ResponseObject.success).toHaveBeenCalledWith(
				200,
				'User successfully deleted',
				mockUser
			);
			expect(next).not.toHaveBeenCalled();
		});

		it('should handle user not found', async () => {
			req.params = { id: 'nonexistent-id' };
			const serviceError = new Error('User not found');
			mockAdminService.deleteUser.mockRejectedValue(serviceError);

			await AdminController.deleteUser(req, res, next);

			expect(next).toHaveBeenCalledWith(serviceError);
		});

		it('should handle missing user id', async () => {
			req.params = {};
			const serviceError = new Error('User ID is required');
			mockAdminService.deleteUser.mockRejectedValue(serviceError);

			await AdminController.deleteUser(req, res, next);

			expect(next).toHaveBeenCalledWith(serviceError);
		});

		it('should handle service errors', async () => {
			req.params = { id: 'test-user-id' };
			const serviceError = new Error('Failed to delete user');
			mockAdminService.deleteUser.mockRejectedValue(serviceError);

			await AdminController.deleteUser(req, res, next);

			expect(next).toHaveBeenCalledWith(serviceError);
		});
	});
});