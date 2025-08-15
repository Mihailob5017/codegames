import { PrismaServiceInstance } from '../config/prisma-config';

import { User } from '../generated/prisma';
import { CreateUserInput } from '../models/user-model';
import { UniqueInputTypes } from '../types/dto/user-types';

export interface IUserRepository {
	checkIfUserExists(uniqueParams: UniqueInputTypes): Promise<User | null>;
	saveUser(user: CreateUserInput): Promise<User>;
	getUser(id: string): Promise<User | null>;
	updateUser(user: Partial<CreateUserInput>): Promise<User>;
}

export class UserRepository implements IUserRepository {
	async checkIfUserExists(
		uniqueParams: UniqueInputTypes
	): Promise<User | null> {
		try {
			return await PrismaServiceInstance.getClient().user.findUnique({
				where: uniqueParams,
			});
		} catch (error) {
			throw new Error(`Failed to check if user exists: ${error}`);
		}
	}

	async saveUser(user: CreateUserInput): Promise<User> {
		try {
			return await PrismaServiceInstance.getClient().user.create({
				data: user,
			});
		} catch (error) {
			throw new Error(`Failed to save user: ${error}`);
		}
	}

	async getUser(id: string): Promise<User | null> {
		try {
			return await PrismaServiceInstance.getClient().user.findUnique({
				where: { id },
			});
		} catch (error) {
			throw new Error(`Failed to get user: ${error}`);
		}
	}

	async updateUser(user: Partial<CreateUserInput>): Promise<User> {
		try {
			return await PrismaServiceInstance.getClient().user.update({
				where: { id: user.id },
				data: user,
			});
		} catch (error) {
			throw new Error(`Failed to update user: ${error}`);
		}
	}
}
