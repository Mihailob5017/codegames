import { UserRepository } from './login-repositories';
import { PrismaServiceInstance } from '../config/prisma-config';
import { User } from '../generated/prisma';
import { CreateUserInput } from '../models/user-model';
import { UniqueInputTypes } from '../types/dto/user-types';

jest.mock('../config/prisma-config');

describe('UserRepository', () => {
	let userRepository: UserRepository;
	let mockPrismaClient: any;

	beforeEach(() => {
		userRepository = new UserRepository();
		mockPrismaClient = {
			user: {
				findUnique: jest.fn(),
				create: jest.fn(),
				update: jest.fn(),
			},
		};
		(PrismaServiceInstance.getClient as jest.Mock).mockReturnValue(mockPrismaClient);
		jest.clearAllMocks();
	});

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

	describe('checkIfUserExists', () => {
		it('should return user when found with username', async () => {
			const uniqueParams: UniqueInputTypes = {
				username: 'testuser',
				email: 'test@example.com',
			};

			mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

			const result = await userRepository.checkIfUserExists(uniqueParams);

			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: uniqueParams,
			});
			expect(result).toEqual(mockUser);
		});

		it('should return null when user not found', async () => {
			const uniqueParams: UniqueInputTypes = {
				username: 'nonexistent',
				email: 'nonexistent@example.com',
			};

			mockPrismaClient.user.findUnique.mockResolvedValue(null);

			const result = await userRepository.checkIfUserExists(uniqueParams);

			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: uniqueParams,
			});
			expect(result).toBeNull();
		});

		it('should throw error when database operation fails', async () => {
			const uniqueParams: UniqueInputTypes = {
				username: 'testuser',
				email: 'test@example.com',
			};
			const errorMessage = 'Database connection failed';

			mockPrismaClient.user.findUnique.mockRejectedValue(new Error(errorMessage));

			await expect(userRepository.checkIfUserExists(uniqueParams)).rejects.toThrow(
				`Failed to check if user exists: Error: ${errorMessage}`
			);
		});
	});

	describe('saveUser', () => {
		it('should create and return new user', async () => {
			const createUserInput: CreateUserInput = {
				id: '1',
				username: 'newuser',
				email: 'new@example.com',
				phoneNumb: '+1234567890',
				isGoogleLogin: false,
				passwordHash: 'hashedpassword',
				googleId: undefined,
				verifyToken: 123456,
				verifyTokenExpiry: new Date(),
				verified: false,
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
			};

			mockPrismaClient.user.create.mockResolvedValue(mockUser);

			const result = await userRepository.saveUser(createUserInput);

			expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
				data: createUserInput,
			});
			expect(result).toEqual(mockUser);
		});

		it('should throw error when user creation fails', async () => {
			const createUserInput: CreateUserInput = {
				id: '1',
				username: 'newuser',
				email: 'new@example.com',
				phoneNumb: '+1234567890',
				isGoogleLogin: false,
				passwordHash: 'hashedpassword',
				googleId: undefined,
				verifyToken: 123456,
				verifyTokenExpiry: new Date(),
				verified: false,
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
			};
			const errorMessage = 'Unique constraint violation';

			mockPrismaClient.user.create.mockRejectedValue(new Error(errorMessage));

			await expect(userRepository.saveUser(createUserInput)).rejects.toThrow(
				`Failed to save user: Error: ${errorMessage}`
			);
		});
	});

	describe('getUser', () => {
		it('should return user when found by id', async () => {
			const userId = '1';

			mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

			const result = await userRepository.getUser(userId);

			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { id: userId },
			});
			expect(result).toEqual(mockUser);
		});

		it('should return null when user not found', async () => {
			const userId = 'nonexistent';

			mockPrismaClient.user.findUnique.mockResolvedValue(null);

			const result = await userRepository.getUser(userId);

			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { id: userId },
			});
			expect(result).toBeNull();
		});

		it('should throw error when database operation fails', async () => {
			const userId = '1';
			const errorMessage = 'Database connection failed';

			mockPrismaClient.user.findUnique.mockRejectedValue(new Error(errorMessage));

			await expect(userRepository.getUser(userId)).rejects.toThrow(
				`Failed to get user: Error: ${errorMessage}`
			);
		});
	});

	describe('updateUser', () => {
		it('should update and return user', async () => {
			const updateData: Partial<CreateUserInput> = {
				id: '1',
				firstName: 'UpdatedName',
				lastName: 'UpdatedLastName',
			};

			const updatedUser = { ...mockUser, ...updateData };
			mockPrismaClient.user.update.mockResolvedValue(updatedUser);

			const result = await userRepository.updateUser(updateData);

			expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
				where: { id: updateData.id },
				data: updateData,
			});
			expect(result).toEqual(updatedUser);
		});

		it('should throw error when user update fails', async () => {
			const updateData: Partial<CreateUserInput> = {
				id: '1',
				firstName: 'UpdatedName',
			};
			const errorMessage = 'Record to update not found';

			mockPrismaClient.user.update.mockRejectedValue(new Error(errorMessage));

			await expect(userRepository.updateUser(updateData)).rejects.toThrow(
				`Failed to update user: Error: ${errorMessage}`
			);
		});

		it('should handle update with minimal data', async () => {
			const updateData: Partial<CreateUserInput> = {
				id: '1',
				verified: true,
			};

			const updatedUser = { ...mockUser, verified: true };
			mockPrismaClient.user.update.mockResolvedValue(updatedUser);

			const result = await userRepository.updateUser(updateData);

			expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
				where: { id: updateData.id },
				data: updateData,
			});
			expect(result).toEqual(updatedUser);
		});
	});
});