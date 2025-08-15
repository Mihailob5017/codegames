import { CreateUserInput } from '../../models/user-model';
import {
	UserRepository,
	IUserRepository,
} from '../../repositories/login-repositories';
import { HttpError } from '../../types/common/error-types';
import {
	CreateUserResponseType,
	JwtPayloadType,
	UserType,
} from '../../types/dto/user-types';
import {
	encryptPassword,
	generateId,
	generateJWT,
	generateToken,
	verifyJWT,
} from '../../utils/auth';
import { validateSignup } from '../../utils/request-validator';
import { EmailService } from '../email/email-service';

interface ISignupService {
	signup(): Promise<CreateUserResponseType>;
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

	public async signup(): Promise<CreateUserResponseType> {
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

	private async checkIfUserExists(): Promise<void> {
		const uniqueParams = {
			email: this.userInput.email as string,
			username: this.userInput.username as string,
			phoneNumb: this.userInput.phoneNumb as string,
		};

		const existingUser = await this.userRepository.checkIfUserExists(
			uniqueParams
		);

		if (existingUser) {
			throw new HttpError(400, 'User already exists');
		}
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

	private async getUser(userId: string): Promise<UserType> {
		if (!userId) {
			throw new HttpError(400, 'User ID is required');
		}

		const user = await this.userRepository.getUser(userId);

		if (!user) {
			throw new HttpError(404, 'User not found');
		}

		return user as UserType;
	}

	private validateOTP(user: UserType, otp: number): void {
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
		const jwtPayload: JwtPayloadType = {
			id: this.userInput.id as string,
			username: this.userInput.username as string,
			email: this.userInput.email as string,
			passwordHash: this.userInput.passwordHash as string,
			phoneNumb: this.userInput.phoneNumb as string,
		};

		return generateJWT(jwtPayload);
	}

	private async createResponse(): Promise<CreateUserResponseType> {
		const jwt = await this.generateUserJWT();

		return {
			jwt,
			user: this.userInput as UserType,
		};
	}
}
