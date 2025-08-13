import { CreateUserInput } from '../../models/user-model';
import { LoginRepository } from '../../repositories/login-repositories';
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
} from '../../utils/auth';
import { validateSignup } from '../../utils/request-validator';
import { htmlTemplate } from '../../templates/html';
import { textTemplate } from '../../templates/text';
const nodemailer = require('nodemailer');
export class SignupService {
	private userInput: Partial<CreateUserInput> = {} as CreateUserInput;
	private transporter: typeof nodemailer;
	constructor(userInput: Partial<CreateUserInput>) {
		this.userInput = userInput;
		const user = process.env.NODEMAILER_EMAIL as string;
		const pass = process.env.NODEMAILER_PASSWORD as string;
		this.transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user,
				pass,
			},
		});
	}

	public normalizeInput(): SignupService {
		const { token, expiry } = generateToken();
		this.userInput = {
			...this.userInput,
			id: generateId() as string,
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
			passwordHash: encryptPassword(this.userInput.passwordHash as string),
		};

		return this;
	}
	public validateInput(): SignupService {
		validateSignup(this.userInput as CreateUserInput);
		return this;
	}

	public async checkIfUserExists(): Promise<SignupService> {
		const uniqueParams = {
			email: this.userInput.email as string,
			username: this.userInput.username as string,
			phoneNumb: this.userInput.phoneNumb as string,
		};

		const existingUser = await LoginRepository.checkIfUserExists(uniqueParams);

		if (existingUser !== null) {
			throw new HttpError(400, 'User already exists');
		}

		return this;
	}
	public sendVerificationToken(): void {
		this.transporter.sendMail({
			from: process.env.NODEMAILER_EMAIL as string,
			to: this.userInput.email as string,
			subject: 'Verification token',
			html: htmlTemplate(this.userInput.verifyToken as number),
			text: textTemplate(this.userInput.verifyToken as number),
		});
	}
	public async saveUser(): Promise<SignupService> {
		if (this.userInput.id === undefined) {
			throw new HttpError(400, 'User id is required');
		} else {
			await LoginRepository.saveUser(this.userInput as CreateUserInput);

			return Promise.resolve(this);
		}
	}

	private generateJWT = async (): Promise<string> => {
		const jwtPayload: JwtPayloadType = {
			username: this.userInput.username as string,
			email: this.userInput.email as string,
			passwordHash: this.userInput.passwordHash as string,
		};

		return generateJWT(jwtPayload);
	};
	public async getResponse(): Promise<CreateUserResponseType> {
		const jsonwebtoken = await this.generateJWT();

		return {
			jwt: jsonwebtoken,
			user: this.userInput as UserType,
		};
	}
}
