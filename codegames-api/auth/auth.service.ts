// codegames-api/auth/auth.service.ts
import { UploadService } from "../upload";
import { AppError } from "../shared/errors/app-error";
import { RegisterInput } from "./auth.dto";
import { AuthRepository } from "./auth.repository";
import bcrypt from "bcryptjs";
import { getAppConfig } from "../infrastructure/app-config";

export class AuthService {
	private static readonly uploadService = new UploadService();
	private static readonly authRepository = new AuthRepository();

	public static readonly register = async (
		userInfo: RegisterInput,
		profileImage?: Express.Multer.File,
	) => {
		const { SALT_ROUNDS } = getAppConfig();

		const [passwordHash, existingUser] = await Promise.all([
			bcrypt.hash(userInfo.password, SALT_ROUNDS),
			AuthService.authRepository.findByUsernameOrEmail(
				userInfo.username,
				userInfo.email,
			),
		]);

		if (existingUser) {
			throw new AppError("Resource already exists", 409);
		}

		const profilePictureUrl = profileImage
			? await AuthService.uploadToS3(profileImage)
			: null;

		return AuthService.authRepository.registerUser({
			username: userInfo.username,
			email: userInfo.email,
			passwordHash,
			firstName: userInfo.firstName,
			lastName: userInfo.lastName,
			profilePictureUrl,
			country: userInfo.country ?? null,
		});
	};

	private static async uploadToS3(
		file: Express.Multer.File,
	): Promise<string> {
		const { url } = await AuthService.uploadService.upload(
			file,
			"user-avatars",
		);
		return url;
	}
}
