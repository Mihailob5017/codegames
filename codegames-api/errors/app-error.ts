export class AppError extends Error {
	public readonly statusCode: number;
	public readonly isOperational: boolean;

	constructor(message: string, statusCode: number, isOperational = true) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = isOperational;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export class BadRequestError extends AppError {
	constructor(message = "Bad request") {
		super(message, 400);
	}
}

export class NotFoundError extends AppError {
	constructor(message = "Resource not found") {
		super(message, 404);
	}
}

export class ValidationError extends AppError {
	public readonly fieldErrors: Record<string, string[] | undefined>;

	constructor(
		message: string,
		fieldErrors: Record<string, string[] | undefined> = {},
	) {
		super(message, 400);
		this.fieldErrors = fieldErrors;
	}
}

export class ExternalServiceError extends AppError {
	constructor(message = "External service error") {
		super(message, 502);
	}
}
