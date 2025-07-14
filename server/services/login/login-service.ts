import { CreateUserInput } from '../../models/user-model';
import { LoginRepository } from '../../repositories/login-repositories';
import { HttpError } from '../../types/common/error-types';
import {
	encryptPassword,
	generateId,
	generateToken,
} from '../../utils/helpers';
import { validateSignup } from '../../utils/request-validator';

export class SignupService {
	private userInput: Partial<CreateUserInput> = {} as CreateUserInput;

	constructor(userInput: Partial<CreateUserInput>) {
		this.userInput = userInput;
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

	public async saveUser(): Promise<SignupService> {
		if (this.userInput.id === undefined) {
			throw new HttpError(400, 'User id is required');
		} else {
			await LoginRepository.saveUser(this.userInput as CreateUserInput);

			return Promise.resolve(this);
		}
	}
}
