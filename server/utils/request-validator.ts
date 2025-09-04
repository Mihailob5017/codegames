import { ZodError, ZodSchema } from 'zod';
import { 
	CreateUserInput, 
	CreateUserInputSchema,
	UserLoginInput,
	UserLoginSchema
} from '../models/user-model';
import { HttpError } from '../types/common/error-types';
import { HttpStatusCode } from './constants';

export class ValidationError extends HttpError {
	constructor(message: string, details?: Record<string, string>) {
		super(HttpStatusCode.BAD_REQUEST, message, details);
	}
}

export function validateSchema<T>(schema: ZodSchema<T>, data: unknown): T {
	try {
		return schema.parse(data);
	} catch (error: unknown) {
		if (error instanceof ZodError) {
			const errorDetails: Record<string, string> = {};
			const errorMessages: string[] = [];

			error.issues.forEach((issue) => {
				const path = issue.path.join('.');
				const message = issue.message;
				errorDetails[path] = message;
				errorMessages.push(`${path}: ${message}`);
			});

			throw new ValidationError(
				`Validation failed: ${errorMessages.join(', ')}`,
				errorDetails
			);
		}
		throw new HttpError(
			HttpStatusCode.SERVER_ERROR,
			'Unexpected validation error'
		);
	}
}

export function validateSignup(userInput: CreateUserInput): CreateUserInput {
	return validateSchema(CreateUserInputSchema, userInput);
}

export function validateLogin(loginInput: UserLoginInput): UserLoginInput {
	return validateSchema(UserLoginSchema, loginInput);
}

export function validateRequired(value: unknown, fieldName: string): void {
	if (value === null || value === undefined || value === '') {
		throw new ValidationError(`${fieldName} is required`);
	}
}

export function validateEmail(email: string): void {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		throw new ValidationError('Invalid email format');
	}
}

export function validatePhoneNumber(phone: string): void {
	if (!phone.startsWith('+')) {
		throw new ValidationError('Phone number must start with country code (+)');
	}

	const cleanPhone = phone.replace(/[^0-9]/g, '');
	if (cleanPhone.length < 10 || cleanPhone.length > 15) {
		throw new ValidationError('Phone number must be between 10 and 15 digits');
	}
}

export function validatePassword(password: string): void {
	if (password.length < 8) {
		throw new ValidationError('Password must be at least 8 characters long');
	}

	if (password.length > 128) {
		throw new ValidationError('Password must be at most 128 characters long');
	}

	const hasUpperCase = /[A-Z]/.test(password);
	const hasLowerCase = /[a-z]/.test(password);
	const hasNumbers = /\d/.test(password);
	const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

	if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
		throw new ValidationError(
			'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
		);
	}
}
