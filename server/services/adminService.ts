import { prismaClient } from '../utils/contants';
import { User } from '../generated/prisma';

/**
 * Retrieves all users from the database.
 * @returns An array of `User` objects containing all users from the database.
 */
export const getAllUsers = async (): Promise<User[]> => {
	try {
		const users = await prismaClient.user.findMany();
		return users;
	} catch (error) {
		throw error;
	}
};
