import { User } from '../generated/prisma';
import { AdminRepository } from '../repositories/admin-repositories';

class AdminService {
	static async getAllUsers(): Promise<User[]> {
		try {
			return await AdminRepository.getAllUsers();
		} catch (error) {
			throw new Error('Failed to fetch all users');
		}
	}

	static async getUser(id: string): Promise<User | null> {
		try {
			return await AdminRepository.getUser(id);
		} catch (error) {
			throw new Error(`Failed to fetch user with id: ${id}`);
		}
	}

	static async deleteUser(id: string): Promise<User> {
		try {
			return await AdminRepository.deleteUser(id);
		} catch (error) {
			throw new Error(`Failed to delete user with id: ${id}`);
		}
	}
}

export default AdminService;
