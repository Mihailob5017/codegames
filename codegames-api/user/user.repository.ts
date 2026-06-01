// codegames-api/user/user.repository.ts
import prisma from "../infrastructure/prisma";

export class UserRepository {
	findById(id: string) {
		return prisma.user.findUnique({ where: { id } });
	}
}
