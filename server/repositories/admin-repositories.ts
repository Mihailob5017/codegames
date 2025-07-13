import { PrismaServiceInstance } from '../config/prisma-config';

import { User } from '../generated/prisma';
export class AdminRepository {
	static async getAllUsers(): Promise<User[]> {
		return PrismaServiceInstance.getClient().user.findMany();
	}

	static async getUser(id: string): Promise<User | null> {
		return PrismaServiceInstance.getClient().user.findUnique({
			where: { id },
		});
	}

	static async deleteUser(id: string): Promise<User> {
		return PrismaServiceInstance.getClient().user.delete({
			where: { id },
		});
	}
}
