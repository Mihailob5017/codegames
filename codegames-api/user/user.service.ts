import { UploadService } from "../upload";
import { CreateUserInput } from "./user.dto";
import { UserRepository } from "./user.repository";
import bcrypt from "bcryptjs";
export class UserService {
	private static readonly uploadService = new UploadService();
	private static readonly userRepository = new UserRepository();
	public static readonly Register = async (
		userInfo: CreateUserInput,
		profileImage?: Express.Multer.File,
	) => {
		const saltRounds: number = parseInt(process.env.SALT_ROUNDS!);

		const passwordHash = await bcrypt.hash(userInfo.password, saltRounds);
		const profilePictureUrl = profileImage
			? await UserService.uploadToS3(profileImage)
			: null;

		return UserService.userRepository.registerUser({
			username: userInfo.username,
			email: userInfo.email,
			passwordHash,
			firstName: userInfo.firstName,
			lastName: userInfo.lastName,
			profilePictureUrl,
			country: userInfo.country ?? null,
		});
	};

	private static async uploadToS3(file: Express.Multer.File): Promise<string> {
		const { url } = await UserService.uploadService.upload(
			file,
			"user-avatars",
		);
		return url;
	}
}
