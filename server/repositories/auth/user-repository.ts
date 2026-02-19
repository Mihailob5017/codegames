import { PrismaServiceInstance } from "../../config/prisma-config";

import { User, Prisma } from "../../generated/prisma";
import { CreateUserInput } from "../../models/user-model";
import {
	UniqueUserFieldsDTO,
	UserOperationType,
	UserExistenceCheckResult,
} from "../../types/dto/user-types";

export interface IUserRepository {
	checkIfUserExists(uniqueParams: UniqueUserFieldsDTO): Promise<User | null>;
	checkUserExistence(
		uniqueParams: UniqueUserFieldsDTO,
		operation: UserOperationType
	): Promise<UserExistenceCheckResult>;
	saveUser(user: CreateUserInput): Promise<User>;
	getUser(id: string): Promise<User | null>;
	updateUser(user: Partial<CreateUserInput>): Promise<User>;
}

export class UserRepository implements IUserRepository {
	async checkIfUserExists(
		uniqueParams: UniqueUserFieldsDTO
	): Promise<User | null> {
		try {
			// Create a proper where clause based on available parameters
			let whereClause: Prisma.UserWhereUniqueInput;

			if (uniqueParams.id) {
				whereClause = { id: uniqueParams.id };
			} else if (uniqueParams.username) {
				whereClause = { username: uniqueParams.username };
			} else if (uniqueParams.email) {
				whereClause = { email: uniqueParams.email };
			} else if (uniqueParams.phoneNumb) {
				whereClause = { phoneNumb: uniqueParams.phoneNumb };
			} else {
				throw new Error("At least one unique field must be provided");
			}

			return await PrismaServiceInstance.getClient().user.findUnique({
				where: whereClause,
			});
		} catch (error) {
			throw new Error(`Failed to check if user exists: ${error}`);
		}
	}

	async checkUserExistence(
		uniqueParams: UniqueUserFieldsDTO,
		operation: UserOperationType
	): Promise<UserExistenceCheckResult> {
		try {
			const user = await this.checkIfUserExists(uniqueParams);

			if (operation === "signup") {
				if (user) {
					// For signup, user should NOT exist
					let message = "User already exists with ";
					const conflicts = [];

					if (uniqueParams.email && user.email === uniqueParams.email) {
						conflicts.push("email");
					}
					if (
						uniqueParams.username &&
						user.username === uniqueParams.username
					) {
						conflicts.push("username");
					}
					if (
						uniqueParams.phoneNumb &&
						user.phoneNumb === uniqueParams.phoneNumb
					) {
						conflicts.push("phone number");
					}

					message += conflicts.join(" and ");

					return {
						exists: true,
						user: user as any, // Type assertion for User to UserDTO
						message,
					};
				} else {
					return {
						exists: false,
						message: "User does not exist, can proceed with signup",
					};
				}
			} else if (operation === "login") {
				if (user) {
					// For login, user SHOULD exist
					return {
						exists: true,
						user: user as any, // Type assertion for User to UserDTO
						message: "User found, can proceed with login",
					};
				} else {
					return {
						exists: false,
						message: "User does not exist with provided credentials",
					};
				}
			} else {
				throw new Error(`Invalid operation type: ${operation}`);
			}
		} catch (error) {
			throw new Error(`Failed to check user existence: ${error}`);
		}
	}

	async saveUser(user: CreateUserInput): Promise<User> {
		try {
			// Prepare user data with required defaults
			const userData: Prisma.UserCreateInput = {
				...user,
				verifyToken:
					user.verifyToken || Math.floor(100000 + Math.random() * 900000),
				verifyTokenExpiry:
					user.verifyTokenExpiry || new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
			};

			return await PrismaServiceInstance.getClient().user.create({
				data: userData,
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
