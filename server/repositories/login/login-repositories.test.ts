import { UserRepository } from './login-repositories';
import { PrismaServiceInstance } from '../../config/prisma-config';
import { createMockUser, createMockCreateUserInput, mockPrismaClient, resetAllMocks } from '../../__tests__/utils/test-helpers';
import { UniqueUserFieldsDTO } from '../../types/dto/user-types';

jest.mock('../../config/prisma-config', () => ({
	PrismaServiceInstance: {
		getClient: () => mockPrismaClient,
	},
}));

describe('UserRepository', () => {
	let userRepository: UserRepository;

	beforeEach(() => {
		userRepository = new UserRepository();
		resetAllMocks();
	});

	describe('checkIfUserExists', () => {
		it('should find user by id', async () => {
			const mockUser = createMockUser();
			const uniqueParams: UniqueUserFieldsDTO = { id: 'test-user-id' };
			mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

			const result = await userRepository.checkIfUserExists(uniqueParams);

			expect(result).toEqual(mockUser);
			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { id: 'test-user-id' },
			});
		});

		it('should find user by username', async () => {
			const mockUser = createMockUser();
			const uniqueParams: UniqueUserFieldsDTO = { username: 'testuser' };
			mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

			const result = await userRepository.checkIfUserExists(uniqueParams);

			expect(result).toEqual(mockUser);
			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { username: 'testuser' },
			});
		});

		it('should find user by email', async () => {
			const mockUser = createMockUser();
			const uniqueParams: UniqueUserFieldsDTO = { email: 'test@example.com' };
			mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

			const result = await userRepository.checkIfUserExists(uniqueParams);

			expect(result).toEqual(mockUser);
			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { email: 'test@example.com' },
			});
		});

		it('should find user by phone number', async () => {
			const mockUser = createMockUser();
			const uniqueParams: UniqueUserFieldsDTO = { phoneNumb: '+1234567890' };
			mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

			const result = await userRepository.checkIfUserExists(uniqueParams);

			expect(result).toEqual(mockUser);
			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { phoneNumb: '+1234567890' },
			});
		});

		it('should return null when user not found', async () => {
			const uniqueParams: UniqueUserFieldsDTO = { email: 'notfound@example.com' };
			mockPrismaClient.user.findUnique.mockResolvedValue(null);

			const result = await userRepository.checkIfUserExists(uniqueParams);

			expect(result).toBeNull();
		});

		it('should throw error when no unique field provided', async () => {
			const uniqueParams: UniqueUserFieldsDTO = {};

			await expect(userRepository.checkIfUserExists(uniqueParams)).rejects.toThrow(
				'Failed to check if user exists: Error: At least one unique field must be provided'
			);
		});

		it('should handle database errors', async () => {
			const uniqueParams: UniqueUserFieldsDTO = { email: 'test@example.com' };
			const dbError = new Error('Database connection failed');
			mockPrismaClient.user.findUnique.mockRejectedValue(dbError);

			await expect(userRepository.checkIfUserExists(uniqueParams)).rejects.toThrow(
				'Failed to check if user exists: Error: Database connection failed'
			);
		});
	});

	describe('saveUser', () => {
		it('should save user successfully', async () => {
			const mockUser = createMockUser();
			const createUserInput = createMockCreateUserInput();
			mockPrismaClient.user.create.mockResolvedValue(mockUser);

			const result = await userRepository.saveUser(createUserInput);

			expect(result).toEqual(mockUser);
			expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
				data: expect.objectContaining({
					...createUserInput,
					verifyToken: expect.any(Number),
					verifyTokenExpiry: expect.any(Date),
				}),
			});
		});

		it('should generate verifyToken when not provided', async () => {
			const mockUser = createMockUser();
			const createUserInput = createMockCreateUserInput({ verifyToken: undefined });
			mockPrismaClient.user.create.mockResolvedValue(mockUser);

			await userRepository.saveUser(createUserInput);

			expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
				data: expect.objectContaining({
					verifyToken: expect.any(Number),
				}),
			});

			const callArgs = mockPrismaClient.user.create.mock.calls[0][0];
			expect(callArgs.data.verifyToken).toBeGreaterThanOrEqual(100000);
			expect(callArgs.data.verifyToken).toBeLessThanOrEqual(999999);
		});

		it('should generate verifyTokenExpiry when not provided', async () => {
			const mockUser = createMockUser();
			const createUserInput = createMockCreateUserInput({ verifyTokenExpiry: undefined });
			mockPrismaClient.user.create.mockResolvedValue(mockUser);

			await userRepository.saveUser(createUserInput);

			expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
				data: expect.objectContaining({
					verifyTokenExpiry: expect.any(Date),
				}),
			});

			const callArgs = mockPrismaClient.user.create.mock.calls[0][0];
			expect(callArgs.data.verifyTokenExpiry.getTime()).toBeGreaterThan(Date.now());
		});

		it('should handle database errors during save', async () => {
			const createUserInput = createMockCreateUserInput();
			const dbError = new Error('Unique constraint violation');
			mockPrismaClient.user.create.mockRejectedValue(dbError);

			await expect(userRepository.saveUser(createUserInput)).rejects.toThrow(
				'Failed to save user: Error: Unique constraint violation'
			);
		});
	});

	describe('getUser', () => {
		it('should get user by id successfully', async () => {
			const mockUser = createMockUser();
			mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

			const result = await userRepository.getUser('test-user-id');

			expect(result).toEqual(mockUser);
			expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
				where: { id: 'test-user-id' },
			});
		});

		it('should return null when user not found', async () => {
			mockPrismaClient.user.findUnique.mockResolvedValue(null);

			const result = await userRepository.getUser('nonexistent-id');

			expect(result).toBeNull();
		});

		it('should handle database errors during get', async () => {
			const dbError = new Error('Database connection failed');
			mockPrismaClient.user.findUnique.mockRejectedValue(dbError);

			await expect(userRepository.getUser('test-user-id')).rejects.toThrow(
				'Failed to get user: Error: Database connection failed'
			);
		});
	});

	describe('updateUser', () => {
		it('should update user successfully', async () => {
			const mockUser = createMockUser({ firstName: 'Updated' });
			const updateInput = createMockCreateUserInput({ id: 'test-user-id', firstName: 'Updated' });
			mockPrismaClient.user.update.mockResolvedValue(mockUser);

			const result = await userRepository.updateUser(updateInput);

			expect(result).toEqual(mockUser);
			expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
				where: { id: 'test-user-id' },
				data: updateInput,
			});
		});

		it('should handle partial updates', async () => {
			const mockUser = createMockUser({ firstName: 'Updated' });
			const partialUpdate = { id: 'test-user-id', firstName: 'Updated' };
			mockPrismaClient.user.update.mockResolvedValue(mockUser);

			const result = await userRepository.updateUser(partialUpdate);

			expect(result).toEqual(mockUser);
			expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
				where: { id: 'test-user-id' },
				data: partialUpdate,
			});
		});

		it('should handle database errors during update', async () => {
			const updateInput = createMockCreateUserInput({ id: 'test-user-id' });
			const dbError = new Error('User not found');
			mockPrismaClient.user.update.mockRejectedValue(dbError);

			await expect(userRepository.updateUser(updateInput)).rejects.toThrow(
				'Failed to update user: Error: User not found'
			);
		});
	});
});