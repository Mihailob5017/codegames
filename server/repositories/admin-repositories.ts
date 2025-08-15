import { PrismaServiceInstance } from '../config/prisma-config';
import { User } from '../generated/prisma';

export interface IAdminRepository {
	getAllUsers(): Promise<User[]>;
	getUser(id: string): Promise<User | null>;
	deleteUser(id: string): Promise<User>;
}

export class AdminRepository implements IAdminRepository {
	async getAllUsers(): Promise<User[]> {
		try {
			return await PrismaServiceInstance.getClient().user.findMany();
		} catch (error) {
			throw new Error(`Failed to get all users: ${error}`);
		}
	}

	async getUser(id: string): Promise<User | null> {
		try {
			if (!id || !id.trim()) {
				throw new Error('User ID is required');
			}

			return await PrismaServiceInstance.getClient().user.findUnique({
				where: { id },
			});
		} catch (error) {
			throw new Error(`Failed to get user: ${error}`);
		}
	}

	async deleteUser(id: string): Promise<User> {
		try {
			if (!id || !id.trim()) {
				throw new Error('User ID is required');
			}

			return await PrismaServiceInstance.getClient().user.delete({
				where: { id },
			});
		} catch (error) {
			throw new Error(`Failed to delete user: ${error}`);
		}
	}
}
