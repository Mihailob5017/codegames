import { ZodError } from 'zod';
import { CreateUserInput, CreateUserInputSchema } from '../models/user-model';
import { HttpError } from '../types/common/error-types';
import { HttpStatusCode } from './constants';

export function validateSignup(userInput: CreateUserInput): void {
	try {
		CreateUserInputSchema.parse(userInput);
	} catch (error: unknown) {
		if (error instanceof ZodError) {
			const errorMessage = error.issues
				.map((err) => `${err.path.join('.')}: ${err.message}`)
				.join(', ');
			throw new HttpError(
				HttpStatusCode.BAD_REQUEST,
				`Validation failed: ${errorMessage}`
			);
		}
		throw new HttpError(
			HttpStatusCode.SERVER_ERROR,
			'Unexpected validation error'
		);
	}
}
