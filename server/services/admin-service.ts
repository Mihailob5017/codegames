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

/**
 * Retrieves a user from the database by their unique ID.
 * @param {string} id - The unique ID of the user to retrieve.
 * @returns {Promise<User | null>} A promise that resolves to the user object if found,
 * or null if no user with the given ID exists.
 * @throws Will throw an error if the database query fails.
 */

export const getUser = async (id: string): Promise<User | null> => {
	try {
		const user = await prismaClient.user.findUnique({
			where: { id },
		});
		return user;
	} catch (error) {
		throw error;
	}
};

/**
 * Deletes a user from the database with the given `id`.
 * @param {string} id The ID of the user to delete.
 * @returns The deleted user.
 * @throws Will throw an error if the user does not exist.
 */
export const deleteUser = async (id: string): Promise<User> => {
	try {
		const user = await prismaClient.user.delete({
			where: { id },
		});
		return user;
	} catch (error) {
		throw error;
	}
};
