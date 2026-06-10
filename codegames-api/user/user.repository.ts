// codegames-api/user/user.repository.ts
import prisma from "../infrastructure/prisma";

class UserRepository {
	findById(id: string) {
		return prisma.user.findUnique({ where: { id } });
	}
}

export default UserRepository;
