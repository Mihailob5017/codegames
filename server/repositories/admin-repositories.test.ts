import { AdminRepository } from './admin-repositories';
import { PrismaServiceInstance } from '../config/prisma-config';
import { User } from '../generated/prisma';

jest.mock('../config/prisma-config');

describe('AdminRepository', () => {
	let mockPrismaClient: any;

	beforeEach(() => {
		mockPrismaClient = {
			user: {
				findMany: jest.fn(),
				findUnique: jest.fn(),
				delete: jest.fn(),
			},
		};
		(PrismaServiceInstance.getClient as jest.Mock).mockReturnValue(mockPrismaClient);
		jest.clearAllMocks();
	});

	describe('getAllUsers', () => {
		it('should return all users', async () => {
			const mockUsers: User[] = [
				{
					id: '1',
					username: 'user1',
					email: 'user1@example.com',
					phoneNumb: '+1234567890',
					isGoogleLogin: false,
					passwordHash: 'hash1',
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
				},
				{
					id: '2',
					username: 'user2',
					email: 'user2@example.com',
					phoneNumb: '+1234567891',
					isGoogleLogin: false,
					passwordHash: 'hash2',
					googleId: null,
					verifyToken: 123457,
					verifyTokenExpiry: new Date(),
					verified: true,
					role: 'user',
					firstName: 'Jane',
					lastName: 'Smith',
					country: 'US',
					isAvatarSelected: false,
					avatar: null,
					isProfileDeleted: false,
					currency: 0,
					pointsScored: 0,
					isProfileOpen: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockPrismaClient.user.findMany.mockResolvedValue(mockUsers);

			const result = await AdminRepository.getAllUsers();

			expect(mockPrismaClient.user.findMany).toHaveBeenCalledTimes(1);
			expect(result).toEqual(mockUsers);
		});

		it('should handle database errors', async () => {
			const errorMessage = 'Database connection failed';
			mockPrismaClient.user.findMany.mockRejectedValue(new Error(errorMessage));

			await expect(AdminRepository.getAllUsers()).rejects.toThrow(errorMessage);
		});
	});

	describe('getUser', () => {
		it('should return a user by id', async () => {
			const userId = '1';
			const mockUser: User = {
				id: userId,
				username: 'user1',
				email: 'user1@example.com',
				phoneNumb: '+1234567890',
				isGoogleLogin: false,
				passwordHash: 'hash1',
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

			mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

			const result = await AdminRepository.getUser(userId);

			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { id: userId },
			});
			expect(result).toEqual(mockUser);
		});

		it('should return null when user is not found', async () => {
			const userId = 'non-existent-id';
			mockPrismaClient.user.findUnique.mockResolvedValue(null);

			const result = await AdminRepository.getUser(userId);

			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { id: userId },
			});
			expect(result).toBeNull();
		});

		it('should handle database errors', async () => {
			const userId = '1';
			const errorMessage = 'Database connection failed';
			mockPrismaClient.user.findUnique.mockRejectedValue(new Error(errorMessage));

			await expect(AdminRepository.getUser(userId)).rejects.toThrow(errorMessage);
		});
	});

	describe('deleteUser', () => {
		it('should delete a user by id', async () => {
			const userId = '1';
			const mockUser: User = {
				id: userId,
				username: 'user1',
				email: 'user1@example.com',
				phoneNumb: '+1234567890',
				isGoogleLogin: false,
				passwordHash: 'hash1',
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

			mockPrismaClient.user.delete.mockResolvedValue(mockUser);

			const result = await AdminRepository.deleteUser(userId);

			expect(mockPrismaClient.user.delete).toHaveBeenCalledWith({
				where: { id: userId },
			});
			expect(result).toEqual(mockUser);
		});

		it('should handle database errors', async () => {
			const userId = '1';
			const errorMessage = 'Database connection failed';
			mockPrismaClient.user.delete.mockRejectedValue(new Error(errorMessage));

			await expect(AdminRepository.deleteUser(userId)).rejects.toThrow(errorMessage);
		});

		it('should handle user not found during deletion', async () => {
			const userId = 'non-existent-id';
			const errorMessage = 'Record to delete does not exist';
			mockPrismaClient.user.delete.mockRejectedValue(new Error(errorMessage));

			await expect(AdminRepository.deleteUser(userId)).rejects.toThrow(errorMessage);
		});
	});
});