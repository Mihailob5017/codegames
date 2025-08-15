import { HttpError } from '../types/common/error-types';
import { HttpStatusCode } from './constants';

export function sanitizeString(input: string): string {
	if (typeof input !== 'string') {
		throw new HttpError(HttpStatusCode.BAD_REQUEST, 'Input must be a string');
	}
	
	return input.trim().toLowerCase();
}

export function parseEnvVar(key: string, defaultValue?: string): string {
	const value = process.env[key];
	
	if (!value && !defaultValue) {
		throw new HttpError(
			HttpStatusCode.SERVER_ERROR,
			`Missing required environment variable: ${key}`
		);
	}
	
	return value || defaultValue!;
}

export function parseEnvInt(key: string, defaultValue?: number): number {
	const value = process.env[key];
	
	if (!value && defaultValue === undefined) {
		throw new HttpError(
			HttpStatusCode.SERVER_ERROR,
			`Missing required environment variable: ${key}`
		);
	}
	
	if (!value) {
		return defaultValue!;
	}
	
	const parsed = parseInt(value, 10);
	if (isNaN(parsed)) {
		throw new HttpError(
			HttpStatusCode.SERVER_ERROR,
			`Invalid integer value for environment variable ${key}: ${value}`
		);
	}
	
	return parsed;
}

export function parseEnvBool(key: string, defaultValue: boolean = false): boolean {
	const value = process.env[key];
	
	if (!value) {
		return defaultValue;
	}
	
	return value.toLowerCase() === 'true';
}

export function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export function isValidUUID(uuid: string): boolean {
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(uuid);
}

export function maskEmail(email: string): string {
	if (!email || !email.includes('@')) {
		return email;
	}
	
	const [localPart, domain] = email.split('@');
	
	if (localPart.length <= 2) {
		return `${localPart[0]}***@${domain}`;
	}
	
	const visibleChars = Math.max(1, Math.floor(localPart.length / 3));
	const maskedPart = '*'.repeat(localPart.length - visibleChars);
	
	return `${localPart.substring(0, visibleChars)}${maskedPart}@${domain}`;
}

export function formatErrorMessage(error: unknown): string {
	if (error instanceof HttpError) {
		return error.message;
	}
	
	if (error instanceof Error) {
		return error.message;
	}
	
	if (typeof error === 'string') {
		return error;
	}
	
	return 'An unexpected error occurred';
}

export function createPaginationInfo(
	page: number,
	limit: number,
	total: number
): {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
} {
	const totalPages = Math.ceil(total / limit);
	
	return {
		page,
		limit,
		total,
		totalPages,
		hasNext: page < totalPages,
		hasPrev: page > 1,
	};
}