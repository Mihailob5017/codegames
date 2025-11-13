import { User } from '../../generated/prisma';
import { CreateUserInput } from '../../models/user-model';
import { Role } from '../../utils/constants';

export const createMockUser = (overrides: Partial<User> = {}): User => ({
	id: '550e8400-e29b-41d4-a716-446655440000',
	username: 'testuser',
	email: 'test@example.com',
	phoneNumb: '+1234567890',
	isGoogleLogin: false,
	passwordHash: 'hashed-password',
	googleId: null,
	verifyToken: 123456,
	verifyTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
	verified: false,
	role: 'user' as Role,
	firstName: 'Test',
	lastName: 'User',
	country: 'US',
	isAvatarSelected: false,
	avatar: null,
	isProfileDeleted: false,
	credits: 100,
	pointsScored: 0,
	isProfileOpen: true,
	createdAt: new Date(),
	updatedAt: new Date(),
	...overrides,
});

export const createMockCreateUserInput = (overrides: Partial<CreateUserInput> = {}): CreateUserInput => ({
	id: '550e8400-e29b-41d4-a716-446655440000',
	username: 'testuser',
	email: 'test@example.com',
	phoneNumb: '+1234567890',
	isGoogleLogin: false,
	passwordHash: 'hashed-password',
	googleId: undefined,
	verifyToken: 123456,
	verifyTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
	verified: false,
	role: 'user' as Role,
	firstName: 'Test',
	lastName: 'User',
	country: 'US',
	isAvatarSelected: false,
	avatar: undefined,
	isProfileDeleted: false,
	credits: 100,
	pointsScored: 0,
	isProfileOpen: true,
	createdAt: new Date(),
	updatedAt: new Date(),
	...overrides,
});

export const createMockRequest = (overrides: any = {}) => ({
	body: {},
	params: {},
	query: {},
	headers: {},
	ip: '127.0.0.1',
	socket: {
		remoteAddress: '127.0.0.1',
	},
	...overrides,
});

export const createMockResponse = () => {
	const res: any = {};
	res.status = jest.fn().mockReturnValue(res);
	res.json = jest.fn().mockReturnValue(res);
	res.send = jest.fn().mockReturnValue(res);
	return res;
};

export const createMockNext = () => jest.fn();

export const mockPrismaClient = {
	user: {
		findUnique: jest.fn(),
		create: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
		findMany: jest.fn(),
	},
	$connect: jest.fn(),
	$disconnect: jest.fn(),
};

export const resetAllMocks = () => {
	Object.values(mockPrismaClient.user).forEach(mock => mock.mockReset());
	mockPrismaClient.$connect.mockReset();
	mockPrismaClient.$disconnect.mockReset();
};