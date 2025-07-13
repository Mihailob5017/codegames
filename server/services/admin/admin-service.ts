import { User } from '../../generated/prisma';
import { AdminRepository } from '../../repositories/admin-repositories';
import { HttpError } from '../../types/common/error-types';

class AdminService {
	static async getAllUsers(): Promise<User[]> {
		const users = await AdminRepository.getAllUsers();
		if (!users || users.length === 0) {
			throw new HttpError(404, 'No users found');
		}
		return users;
	}

	static async getUser(id: string): Promise<User | null> {
		const user = await AdminRepository.getUser(id);
		if (!user) {
			throw new HttpError(404, 'User not found');
		}
		return user;
	}

	static async deleteUser(id: string): Promise<User> {
		const user = await AdminRepository.getUser(id);
		if (!user) {
			throw new HttpError(404, 'User not found');
		}
		return AdminRepository.deleteUser(id);
	}
}

export default AdminService;
