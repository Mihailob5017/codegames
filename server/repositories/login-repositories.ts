import { PrismaServiceInstance } from '../config/prisma-config';

import { User } from '../generated/prisma';
import { CreateUserInput } from '../models/user-model';
import { UniqueInputTypes } from '../types/dto/user-types';

export class LoginRepository {
	static checkIfUserExists(
		uniqueParams: UniqueInputTypes
	): Promise<User | null> {
		return PrismaServiceInstance.getClient().user.findUniqueOrThrow({
			where: uniqueParams,
		});
	}
	static saveUser(user: CreateUserInput): Promise<User> {
		return PrismaServiceInstance.getClient().user.create({
			data: user,
		});
	}
}
