// codegames-api/auth/auth.service.ts
import UploadService from "../upload/upload.service";
import { ConflictError } from "../shared/errors/app-error";
import { RegisterInput } from "./auth.dto";
import AuthRepository from "./auth.repository";
import bcrypt from "bcryptjs";
import { getAppConfig } from "../infrastructure/app-config";

class AuthService {
	private readonly uploadService: UploadService;
	private readonly authRepository: AuthRepository;

	constructor() {
		this.uploadService = new UploadService();
		this.authRepository = new AuthRepository();
	}

	async register(
		userInfo: RegisterInput,
		profileImage?: Express.Multer.File,
	) {
		const { SALT_ROUNDS } = getAppConfig();

		const [passwordHash, existingUser] = await Promise.all([
			bcrypt.hash(userInfo.password, SALT_ROUNDS),
			this.authRepository.findByUsernameOrEmail(
				userInfo.username,
				userInfo.email,
			),
		]);

		if (existingUser) {
			throw new ConflictError(
				"User with this username or email already exists",
			);
		}

		const profilePictureUrl = profileImage
			? await this.uploadToS3(profileImage)
			: null;

		return this.authRepository.registerUser({
			username: userInfo.username,
			email: userInfo.email,
			passwordHash,
			firstName: userInfo.firstName,
			lastName: userInfo.lastName,
			profilePictureUrl,
			country: userInfo.country ?? null,
		});
	}

	private async uploadToS3(file: Express.Multer.File): Promise<string> {
		const { url } = await this.uploadService.upload(file, "user-avatars");
		return url;
	}
}

export default AuthService;
