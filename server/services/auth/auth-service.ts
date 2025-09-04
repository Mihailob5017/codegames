import { CreateUserInput } from '../../models/user-model';
import {
	UserRepository,
	IUserRepository,
} from '../../repositories/login-repositories';
import { HttpError } from '../../types/common/error-types';
import {
	AuthResponseDTO,
	JwtPayloadDTO,
	UserDTO,
} from '../../types/dto/user-types';
import { BCRYPT_SALT_ROUNDS, Role } from '../../utils/constants';
import {
	comparePassword,
	encryptPassword,
	generateId,
	generateJWT,
	generateToken,
	verifyJWT,
} from '../../utils/auth';
import { validateLogin, validateSignup } from '../../utils/request-validator';
import { EmailService } from '../email/email-service';

import bcrypt from 'bcryptjs';

interface ISignupService {
	signup(): Promise<AuthResponseDTO>;
	verifyOTP(token: string, otp: number): Promise<void>;
}

export class AuthService implements ISignupService {
	private userInput: Partial<CreateUserInput>;
	private emailService: EmailService;
	private userRepository: IUserRepository;

	constructor(
		userInput: Partial<CreateUserInput>,
		userRepository?: IUserRepository,
		emailService?: EmailService
	) {
		this.userInput = { ...userInput };
		this.userRepository = userRepository || new UserRepository();
		this.emailService = emailService || new EmailService();
	}

	public async signup(): Promise<AuthResponseDTO> {
		try {
			this.normalizeInput();
			this.validateInput();

			await this.checkIfUserExists();

			await this.saveUser();

			await this.sendVerificationEmail();

			return await this.createResponse();
		} catch (error) {
			throw error;
		}
	}

	private validatePassword(hash: string): boolean {
		return comparePassword(this.userInput.passwordHash as string, hash);
	}

	public async login(): Promise<AuthResponseDTO> {
		try {
			this.validateLogin();

			const data = await this.checkUserForLogin();
			if (!data) throw new HttpError(404, 'User not found');

			if (!data.passwordHash)
				throw new HttpError(404, 'User password not found');

			const isPasswordValid = this.validatePassword(data.passwordHash);
			if (!isPasswordValid) throw new HttpError(400, 'Invalid password');

			if (!data.verified) {
				throw new HttpError(403, 'Account verification required');
			}

			this.userInput = data;
			return await this.createResponse();
		} catch (error) {
			throw error;
		}
	}
	public async verifyOTP(token: string, otp: number): Promise<void> {
		try {
			const userInfo = this.extractUserFromToken(token);
			this.userInput = userInfo;

			const user = await this.getUser(userInfo.id as string);

			this.validateOTP(user, otp);

			await this.markUserAsVerified(user.id);
		} catch (error) {
			throw error;
		}
	}

	private normalizeInput(): void {
		const { token, expiry } = generateToken();

		this.userInput = {
			...this.userInput,
			id: generateId(),
			createdAt: new Date(),
			updatedAt: new Date(),
			googleId: this.userInput.isGoogleLogin ? this.userInput.googleId : '',
			isProfileDeleted: false,
			isProfileOpen: true,
			currency: 0,
			pointsScored: 0,
			role: 'user',
			verifyToken: token,
			verifyTokenExpiry: expiry,
			verified: false,
			passwordHash: this.userInput.passwordHash
				? encryptPassword(this.userInput.passwordHash)
				: undefined,
		};
	}

	private validateInput(): void {
		validateSignup(this.userInput as CreateUserInput);
	}
	private validateLogin(): void {
		validateLogin({
			email: this.userInput.email as string,
			password: this.userInput.passwordHash as string,
		});
	}

	private async checkIfUserExists(): Promise<void> {
		const uniqueParams = {
			email: this.userInput.email as string,
			username: this.userInput.username as string,
			phoneNumb: this.userInput.phoneNumb as string,
		};

		const result = await this.userRepository.checkUserExistence(
			uniqueParams,
			'signup'
		);

		if (result.exists) {
			throw new HttpError(400, result.message);
		}
	}

	private async checkUserForLogin(): Promise<UserDTO> {
		const uniqueParams = {
			email: this.userInput.email as string,
		};

		const result = await this.userRepository.checkUserExistence(
			uniqueParams,
			'login'
		);

		if (!result.exists || !result.user) {
			throw new HttpError(404, 'User not found');
		}

		return result.user;
	}

	private async saveUser(): Promise<void> {
		if (!this.userInput.id) {
			throw new HttpError(400, 'User ID is required');
		}

		await this.userRepository.saveUser(this.userInput as CreateUserInput);
	}

	private async sendVerificationEmail(): Promise<void> {
		if (!this.userInput.email || !this.userInput.verifyToken) {
			throw new HttpError(400, 'Email and verification token are required');
		}

		await this.emailService.sendVerificationEmail(
			this.userInput.email,
			this.userInput.verifyToken
		);
	}

	private extractUserFromToken(token: string): Partial<CreateUserInput> {
		const payload = verifyJWT(token);
		const { id, email, username, phoneNumb } = payload;
		return { id, email, username, phoneNumb };
	}

	private async getUser(userId: string): Promise<UserDTO> {
		if (!userId) {
			throw new HttpError(400, 'User ID is required');
		}

		const user = await this.userRepository.getUser(userId);

		if (!user) {
			throw new HttpError(404, 'User not found');
		}

		return user as UserDTO;
	}

	private validateOTP(user: UserDTO, otp: number): void {
		if (!user) {
			throw new HttpError(400, 'User is required');
		}

		if (otp === null || otp === undefined) {
			throw new HttpError(400, 'OTP is required');
		}

		const { verifyToken, verifyTokenExpiry } = user;

		if (!verifyToken) {
			throw new HttpError(400, 'No verification token found');
		}

		if (String(verifyToken) !== String(otp)) {
			throw new HttpError(400, 'Invalid OTP');
		}

		if (verifyTokenExpiry && verifyTokenExpiry < new Date()) {
			throw new HttpError(400, 'OTP has expired');
		}
	}

	public async resendOTP(token: string): Promise<void> {
		const userInfo = this.extractUserFromToken(token);
		const user = await this.getUser(userInfo.id as string);

		if (user.verified) {
			throw new HttpError(400, 'Account is already verified');
		}

		const { token: newOTP, expiry } = generateToken();

		await this.userRepository.updateUser({
			id: user.id,
			verifyToken: newOTP,
			verifyTokenExpiry: expiry,
		});

		if (!userInfo.email) {
			throw new HttpError(400, 'Email address is required for OTP resend');
		}

		await this.emailService.sendVerificationEmail(userInfo.email, newOTP);
	}

	private async markUserAsVerified(userId: string): Promise<void> {
		if (!userId) {
			throw new HttpError(400, 'User ID is required');
		}

		await this.userRepository.updateUser({
			id: userId,
			verified: true,
			verifyToken: undefined,
			verifyTokenExpiry: undefined,
		});
	}

	private async generateUserJWT(): Promise<string> {
		const jwtPayload: JwtPayloadDTO = {
			id: this.userInput.id as string,
			username: this.userInput.username as string,
			email: this.userInput.email as string,
			passwordHash: this.userInput.passwordHash as string,
			phoneNumb: this.userInput.phoneNumb as string,
			role: this.userInput.role as Role,
		};
		console.log(jwtPayload);
		return generateJWT(jwtPayload);
	}

	private async createResponse(): Promise<AuthResponseDTO> {
		const jwt = await this.generateUserJWT();

		return {
			jwt,
			user: this.userInput as UserDTO,
		};
	}
}
