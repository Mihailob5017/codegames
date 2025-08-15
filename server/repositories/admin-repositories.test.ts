import { AdminRepository } from './admin-repositories';
import { PrismaServiceInstance } from '../config/prisma-config';
import { createMockUser, mockPrismaClient, resetAllMocks } from '../__tests__/utils/test-helpers';

jest.mock('../config/prisma-config', () => ({
	PrismaServiceInstance: {
		getClient: () => mockPrismaClient,
	},
}));

describe('AdminRepository', () => {
	let adminRepository: AdminRepository;

	beforeEach(() => {
		adminRepository = new AdminRepository();
		resetAllMocks();
	});

	describe('getAllUsers', () => {
		it('should return all users successfully', async () => {
			const mockUsers = [
				createMockUser({ id: 'user-1', username: 'user1' }),
				createMockUser({ id: 'user-2', username: 'user2' }),
				createMockUser({ id: 'user-3', username: 'user3' }),
			];
			mockPrismaClient.user.findMany.mockResolvedValue(mockUsers);

			const result = await adminRepository.getAllUsers();

			expect(result).toEqual(mockUsers);
			expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith();
		});

		it('should return empty array when no users exist', async () => {
			mockPrismaClient.user.findMany.mockResolvedValue([]);

			const result = await adminRepository.getAllUsers();

			expect(result).toEqual([]);
			expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith();
		});

		it('should handle database errors', async () => {
			const dbError = new Error('Database connection failed');
			mockPrismaClient.user.findMany.mockRejectedValue(dbError);

			await expect(adminRepository.getAllUsers()).rejects.toThrow(
				'Failed to get all users: Error: Database connection failed'
			);
		});
	});

	describe('getUser', () => {
		it('should get user by id successfully', async () => {
			const mockUser = createMockUser();
			mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

			const result = await adminRepository.getUser('test-user-id');

			expect(result).toEqual(mockUser);
			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { id: 'test-user-id' },
			});
		});

		it('should return null when user not found', async () => {
			mockPrismaClient.user.findUnique.mockResolvedValue(null);

			const result = await adminRepository.getUser('nonexistent-id');

			expect(result).toBeNull();
		});

		it('should handle database errors', async () => {
			const dbError = new Error('Database connection failed');
			mockPrismaClient.user.findUnique.mockRejectedValue(dbError);

			await expect(adminRepository.getUser('test-user-id')).rejects.toThrow(
				'Failed to get user: Error: Database connection failed'
			);
		});
	});

	describe('deleteUser', () => {
		it('should delete user successfully', async () => {
			const mockUser = createMockUser();
			mockPrismaClient.user.delete.mockResolvedValue(mockUser);

			const result = await adminRepository.deleteUser('test-user-id');

			expect(result).toEqual(mockUser);
			expect(mockPrismaClient.user.delete).toHaveBeenCalledWith({
				where: { id: 'test-user-id' },
			});
		});

		it('should handle errors when user not found', async () => {
			const dbError = new Error('Record to delete does not exist');
			mockPrismaClient.user.delete.mockRejectedValue(dbError);

			await expect(adminRepository.deleteUser('nonexistent-id')).rejects.toThrow(
				'Failed to delete user: Error: Record to delete does not exist'
			);
		});

		it('should handle database connection errors', async () => {
			const dbError = new Error('Database connection failed');
			mockPrismaClient.user.delete.mockRejectedValue(dbError);

			await expect(adminRepository.deleteUser('test-user-id')).rejects.toThrow(
				'Failed to delete user: Error: Database connection failed'
			);
		});
	});
});