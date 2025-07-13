import AdminService from './admin-service';
import { AdminRepository } from '../../repositories/admin-repositories';
import { HttpError } from '../../types/common/error-types';
import { User } from '../../generated/prisma';

describe('AdminService', () => {
	const mockUser1: Partial<User> = {
		id: '1',
		email: '1',
	};
	const mockUser2: Partial<User> = {
		id: '2',
		email: '2',
	};
	const mockUsers: Partial<User>[] = [mockUser1, mockUser2];

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('getAllUsers', () => {
		beforeEach(() => {
			jest.clearAllMocks();
			AdminRepository.getAllUsers = jest
				.fn()
				.mockResolvedValue(mockUsers as User[]);
		});

		it('should call AdminRepository.getAllUsers', async () => {
			await AdminService.getAllUsers();
			expect(AdminRepository.getAllUsers).toHaveBeenCalled();
		});

		it('should throw an error if no users are found', async () => {
			AdminRepository.getAllUsers = jest.fn().mockResolvedValue([]);
			await expect(AdminService.getAllUsers()).rejects.toThrow(HttpError);
		});

		it('should return all users', async () => {
			const users = await AdminService.getAllUsers();
			expect(users).toEqual(mockUsers as User[]);
		});
	});

	describe('getUser', () => {
		let user: User | null;
		beforeEach(async () => {
			AdminRepository.getUser = jest.fn().mockResolvedValue(mockUser1 as User);
			user = await AdminService.getUser('1');
		});
		it('should call AdminRepository.getUser', async () => {
			expect(AdminRepository.getUser).toHaveBeenCalled();
		});

		it('should throw an error if no user is found', async () => {
			AdminRepository.getUser = jest.fn().mockResolvedValue(null);
			await expect(AdminService.getUser('1')).rejects.toThrow(HttpError);
		});

		it('should return the user', async () => {
			expect(user).toEqual(mockUser1 as User);
		});
	});

	describe('deleteUser', () => {
		let user: User;
		beforeEach(async () => {
			AdminRepository.deleteUser = jest
				.fn()
				.mockResolvedValue(mockUser1 as User);
			user = await AdminService.deleteUser('1');
		});

		it('should call ', async () => {
			expect(AdminRepository.deleteUser).toHaveBeenCalled();
		});

		it('should throw an error if no user is found', async () => {
			AdminRepository.getUser = jest.fn().mockResolvedValue(null);
			await expect(AdminService.deleteUser('1')).rejects.toThrow(HttpError);
		});
	});
});
