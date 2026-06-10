// codegames-api/auth/auth.repository.ts
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

class AuthRepository {
	findByUsernameOrEmail(username: string, email: string) {
		return prisma.user.findFirst({
			where: {
				OR: [{ username }, { email }],
			},
			select: { id: true },
		});
	}

	registerUser(data: RegisterUserData) {
		return prisma.user.create({ data });
	}
}

export default AuthRepository;
