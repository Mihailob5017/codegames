import { CreateUserInput } from '../../models/user-model';
import { HttpError } from '../../types/common/error-types';
import { HttpStatusCode } from '../../utils/constants';
import { validateSignup } from '../../utils/request-validator';

export class SignupService {
	private instance: SignupService;
	private userInput: CreateUserInput;
	constructor(userInput?: CreateUserInput) {
		if (!userInput) {
			throw new HttpError(HttpStatusCode.BAD_REQUEST, 'User input is required');
		}
		this.userInput = userInput;
		this.instance = new SignupService();
	}

	private getLoginService(): SignupService {
		return this.instance;
	}

	public checkUserInput(): SignupService {
		validateSignup(this.userInput);
		return this.getLoginService();
	}

	public checkIfUserExists(id: string): SignupService {
		return this.getLoginService();
	}
}
