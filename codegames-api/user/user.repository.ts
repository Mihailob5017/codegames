import prisma from "../infrastructure/prisma";

export type RegisterUserData = {
	username: string;
	email: string;
	passwordHash: string;
	firstName: string;
	lastName: string;
	profilePictureUrl?: string | null;
	country?: string | null;
};

export class UserRepository {
	registerUser(data: RegisterUserData) {
		return prisma.user.create({
			data,
		});
	}
}
