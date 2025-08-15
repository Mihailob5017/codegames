import { User } from '../../generated/prisma';
import { AdminRepository, IAdminRepository } from '../../repositories/admin-repositories';
import { HttpError } from '../../types/common/error-types';

export interface IAdminService {
	getAllUsers(): Promise<User[]>;
	getUser(id: string): Promise<User | null>;
	deleteUser(id: string): Promise<User>;
}

export class AdminService implements IAdminService {
	private adminRepository: IAdminRepository;

	constructor(adminRepository?: IAdminRepository) {
		this.adminRepository = adminRepository || new AdminRepository();
	}

	async getAllUsers(): Promise<User[]> {
		try {
			const users = await this.adminRepository.getAllUsers();
			if (!users || users.length === 0) {
				throw new HttpError(404, 'No users found');
			}
			return users;
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new Error(`Failed to get all users: ${error}`);
		}
	}

	async getUser(id: string): Promise<User | null> {
		try {
			if (!id) {
				throw new HttpError(400, 'User ID is required');
			}

			const user = await this.adminRepository.getUser(id);
			if (!user) {
				throw new HttpError(404, 'User not found');
			}
			return user;
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new Error(`Failed to get user: ${error}`);
		}
	}

	async deleteUser(id: string): Promise<User> {
		try {
			if (!id) {
				throw new HttpError(400, 'User ID is required');
			}

			const user = await this.adminRepository.getUser(id);
			if (!user) {
				throw new HttpError(404, 'User not found');
			}
			return await this.adminRepository.deleteUser(id);
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new Error(`Failed to delete user: ${error}`);
		}
	}
}

export default AdminService;
