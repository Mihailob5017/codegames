import AdminService from './admin-service';
import { AdminRepository } from '../../repositories/admin-repositories';
import { HttpError } from '../../types/common/error-types';
import { User } from '../../generated/prisma';

jest.mock('../../repositories/admin-repositories');

describe('AdminService', () => {
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
		jest.clearAllMocks();
	});

	describe('getAllUsers', () => {
		it('should return all users when users exist', async () => {
			const mockUsers = [mockUser, { ...mockUser, id: '2', username: 'user2' }];
			(AdminRepository.getAllUsers as jest.Mock).mockResolvedValue(mockUsers);

			const result = await AdminService.getAllUsers();

			expect(AdminRepository.getAllUsers).toHaveBeenCalledTimes(1);
			expect(result).toEqual(mockUsers);
		});

		it('should throw HttpError when no users found (empty array)', async () => {
			(AdminRepository.getAllUsers as jest.Mock).mockResolvedValue([]);

			await expect(AdminService.getAllUsers()).rejects.toThrow(HttpError);
			await expect(AdminService.getAllUsers()).rejects.toThrow('No users found');
		});

		it('should throw HttpError when users is null', async () => {
			(AdminRepository.getAllUsers as jest.Mock).mockResolvedValue(null);

			await expect(AdminService.getAllUsers()).rejects.toThrow(HttpError);
			await expect(AdminService.getAllUsers()).rejects.toThrow('No users found');
		});

		it('should propagate repository errors', async () => {
			const errorMessage = 'Database connection failed';
			(AdminRepository.getAllUsers as jest.Mock).mockRejectedValue(new Error(errorMessage));

			await expect(AdminService.getAllUsers()).rejects.toThrow(errorMessage);
		});
	});

	describe('getUser', () => {
		it('should return user when user exists', async () => {
			const userId = '1';
			(AdminRepository.getUser as jest.Mock).mockResolvedValue(mockUser);

			const result = await AdminService.getUser(userId);

			expect(AdminRepository.getUser).toHaveBeenCalledWith(userId);
			expect(result).toEqual(mockUser);
		});

		it('should throw HttpError when user not found', async () => {
			const userId = 'non-existent';
			(AdminRepository.getUser as jest.Mock).mockResolvedValue(null);

			await expect(AdminService.getUser(userId)).rejects.toThrow(HttpError);
			await expect(AdminService.getUser(userId)).rejects.toThrow('User not found');
		});

		it('should propagate repository errors', async () => {
			const userId = '1';
			const errorMessage = 'Database connection failed';
			(AdminRepository.getUser as jest.Mock).mockRejectedValue(new Error(errorMessage));

			await expect(AdminService.getUser(userId)).rejects.toThrow(errorMessage);
		});
	});

	describe('deleteUser', () => {
		it('should delete user when user exists', async () => {
			const userId = '1';
			(AdminRepository.getUser as jest.Mock).mockResolvedValue(mockUser);
			(AdminRepository.deleteUser as jest.Mock).mockResolvedValue(mockUser);

			const result = await AdminService.deleteUser(userId);

			expect(AdminRepository.getUser).toHaveBeenCalledWith(userId);
			expect(AdminRepository.deleteUser).toHaveBeenCalledWith(userId);
			expect(result).toEqual(mockUser);
		});

		it('should throw HttpError when user not found before deletion', async () => {
			const userId = 'non-existent';
			(AdminRepository.getUser as jest.Mock).mockResolvedValue(null);

			await expect(AdminService.deleteUser(userId)).rejects.toThrow(HttpError);
			await expect(AdminService.deleteUser(userId)).rejects.toThrow('User not found');
			expect(AdminRepository.deleteUser).not.toHaveBeenCalled();
		});

		it('should propagate repository errors from getUser', async () => {
			const userId = '1';
			const errorMessage = 'Database connection failed';
			(AdminRepository.getUser as jest.Mock).mockRejectedValue(new Error(errorMessage));

			await expect(AdminService.deleteUser(userId)).rejects.toThrow(errorMessage);
			expect(AdminRepository.deleteUser).not.toHaveBeenCalled();
		});

		it('should propagate repository errors from deleteUser', async () => {
			const userId = '1';
			const errorMessage = 'Failed to delete user';
			(AdminRepository.getUser as jest.Mock).mockResolvedValue(mockUser);
			(AdminRepository.deleteUser as jest.Mock).mockRejectedValue(new Error(errorMessage));

			await expect(AdminService.deleteUser(userId)).rejects.toThrow(errorMessage);
			expect(AdminRepository.getUser).toHaveBeenCalledWith(userId);
			expect(AdminRepository.deleteUser).toHaveBeenCalledWith(userId);
		});
	});
});
