import { AdminService } from './admin-service';
import { IAdminRepository } from '../../repositories/admin/admin-repositories';
import { createMockUser } from '../../__tests__/utils/test-helpers';

describe('AdminService', () => {
	let adminService: AdminService;
	let mockAdminRepository: jest.Mocked<IAdminRepository>;

	beforeEach(() => {
		mockAdminRepository = {
			getAllUsers: jest.fn(),
			getUser: jest.fn(),
			deleteUser: jest.fn(),
			addProblem: jest.fn(),
			addTestcase: jest.fn(),
			getProblems: jest.fn(),
			getProblem: jest.fn(),
			getTestCases: jest.fn(),
			getTestCase: jest.fn(),
			updateProblem: jest.fn(),
			updateTestCase: jest.fn(),
			deleteProblem: jest.fn(),
			deleteTestCase: jest.fn(),
			deleteTestCases: jest.fn(),
		};
		adminService = new AdminService(mockAdminRepository);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getAllUsers', () => {
		it('should return all users successfully', async () => {
			const mockUsers = [
				createMockUser({ id: 'user-1', username: 'user1' }),
				createMockUser({ id: 'user-2', username: 'user2' }),
				createMockUser({ id: 'user-3', username: 'user3' }),
			];
			mockAdminRepository.getAllUsers.mockResolvedValue(mockUsers);

			const result = await adminService.getAllUsers();

			expect(result).toEqual(mockUsers);
			expect(mockAdminRepository.getAllUsers).toHaveBeenCalledTimes(1);
		});

		it('should throw HttpError when no users exist', async () => {
			mockAdminRepository.getAllUsers.mockResolvedValue([]);

			await expect(adminService.getAllUsers()).rejects.toThrow(
				'No users found'
			);
		});

		it('should handle repository errors', async () => {
			const repositoryError = new Error('Repository error');
			mockAdminRepository.getAllUsers.mockRejectedValue(repositoryError);

			await expect(adminService.getAllUsers()).rejects.toThrow(
				'Failed to get all users: Error: Repository error'
			);
		});

		it('should handle unexpected errors', async () => {
			mockAdminRepository.getAllUsers.mockRejectedValue('Unexpected error');

			await expect(adminService.getAllUsers()).rejects.toThrow(
				'Failed to get all users: Unexpected error'
			);
		});
	});

	describe('getUser', () => {
		it('should return user when found', async () => {
			const mockUser = createMockUser();
			mockAdminRepository.getUser.mockResolvedValue(mockUser);

			const result = await adminService.getUser('test-user-id');

			expect(result).toEqual(mockUser);
			expect(mockAdminRepository.getUser).toHaveBeenCalledWith('test-user-id');
		});

		it('should throw HttpError when user not found', async () => {
			mockAdminRepository.getUser.mockResolvedValue(null);

			await expect(adminService.getUser('nonexistent-id')).rejects.toThrow(
				'User not found'
			);
		});

		it('should handle repository errors', async () => {
			const repositoryError = new Error('Database connection failed');
			mockAdminRepository.getUser.mockRejectedValue(repositoryError);

			await expect(adminService.getUser('test-user-id')).rejects.toThrow(
				'Failed to get user: Error: Database connection failed'
			);
		});

		it('should throw HttpError for empty string id', async () => {
			await expect(adminService.getUser('')).rejects.toThrow(
				'User ID is required'
			);
		});
	});

	describe('deleteUser', () => {
		it('should delete user successfully', async () => {
			const mockUser = createMockUser();
			mockAdminRepository.getUser.mockResolvedValue(mockUser);
			mockAdminRepository.deleteUser.mockResolvedValue(mockUser);

			const result = await adminService.deleteUser('test-user-id');

			expect(result).toEqual(mockUser);
			expect(mockAdminRepository.getUser).toHaveBeenCalledWith('test-user-id');
			expect(mockAdminRepository.deleteUser).toHaveBeenCalledWith(
				'test-user-id'
			);
		});

		it('should throw HttpError when user not found', async () => {
			mockAdminRepository.getUser.mockResolvedValue(null);

			await expect(adminService.deleteUser('nonexistent-id')).rejects.toThrow(
				'User not found'
			);
		});

		it('should handle repository errors during delete', async () => {
			const mockUser = createMockUser();
			mockAdminRepository.getUser.mockResolvedValue(mockUser);
			const repositoryError = new Error('Database connection failed');
			mockAdminRepository.deleteUser.mockRejectedValue(repositoryError);

			await expect(adminService.deleteUser('test-user-id')).rejects.toThrow(
				'Failed to delete user: Error: Database connection failed'
			);
		});

		it('should throw HttpError for empty user id', async () => {
			await expect(adminService.deleteUser('')).rejects.toThrow(
				'User ID is required'
			);
		});
	});

	describe('constructor', () => {
		it('should create service with provided repository', () => {
			const service = new AdminService(mockAdminRepository);
			expect(service).toBeInstanceOf(AdminService);
		});

		it('should create service with default repository when none provided', () => {
			const service = new AdminService();
			expect(service).toBeInstanceOf(AdminService);
		});
	});
});
