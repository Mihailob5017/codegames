import { PrismaServiceInstance } from '../config/prisma-config';

import { User } from '../generated/prisma';
import { CreateUserInput } from '../models/user-model';
import { UniqueInputTypes } from '../types/dto/user-types';

export class LoginRepository {
	static checkIfUserExists(
		uniqueParams: UniqueInputTypes
	): Promise<User | null> {
		return PrismaServiceInstance.getClient().user.findUnique({
			where: uniqueParams,
		});
	}
	static saveUser(user: CreateUserInput): Promise<User> {
		return PrismaServiceInstance.getClient().user.create({
			data: user,
		});
	}

	static async getUser(id: string): Promise<User | null> {
		return PrismaServiceInstance.getClient().user.findUnique({
			where: { id },
		});
	}

	static async updateUser(user: Partial<CreateUserInput>): Promise<User> {
		return PrismaServiceInstance.getClient().user.update({
			where: { id: user.id },
			data: user,
		});
	}
}
