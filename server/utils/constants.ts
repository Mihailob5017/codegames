export enum HttpStatusCode {
	OK = 200,
	CREATED = 201,
	BAD_REQUEST = 400,
	UNAUTHORIZED = 401,
	NOT_FOUND = 404,
	CONFLICT = 409,
	SERVER_ERROR = 500,
}

export const API_MESSAGES = {
	SERVER_ERROR: 'Something went wrong, try again later',
	USER_CREATED: 'User created successfully',
	USER_AUTHENTICATED: 'User authenticated successfully',
	USER_RETURNED: 'User retrieved successfully',
	USERS_RETURNED: 'Users retrieved successfully',
	USER_DELETED: 'User deleted successfully',
	USER_NOT_FOUND: 'User does not exist',
	INVALID_CREDENTIALS: 'Invalid user email or password',
	INVALID_EMAIL: 'Enter a valid email address',
	EMAIL_VERIFIED: 'Email verified successfully. Your account is now active.',
	VERIFICATION_EMAIL_SENT: 'User successfully created. A verification token has been sent to your email.',
} as const;

export const VALIDATION_RULES = {
	USERNAME: {
		MIN: 3,
		MAX: 15,
	},
	EMAIL: {
		MIN: 6,
		MAX: 45,
	},
	PASSWORD: {
		MIN: 8,
		MAX: 128,
	},
	PHONE: {
		MIN: 10,
		PREFIX: '+',
	},
} as const;

export const USER_ROLES = ['user', 'admin'] as const;
export type Role = typeof USER_ROLES[number];

export const USER_DEFAULTS = {
	IS_GOOGLE_LOGIN: false,
	VERIFIED: false,
	IS_AVATAR_SELECTED: false,
	IS_PROFILE_DELETED: false,
	IS_PROFILE_OPEN: true,
	CREDITS: 100,
	POINTS_SCORED: 0,
	ROLE: 'user' as Role,
} as const;

export const VALIDATION_ERRORS = {
	USERNAME: {
		MIN: `Username must be at least ${VALIDATION_RULES.USERNAME.MIN} characters long`,
		MAX: `Username must be at most ${VALIDATION_RULES.USERNAME.MAX} characters long`,
	},
	EMAIL: {
		INVALID: 'Email must be a valid email address',
		MIN: `Email must be at least ${VALIDATION_RULES.EMAIL.MIN} characters long`,
		MAX: `Email must be at most ${VALIDATION_RULES.EMAIL.MAX} characters long`,
	},
	PASSWORD: {
		MIN: `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN} characters long`,
		MAX: `Password must be at most ${VALIDATION_RULES.PASSWORD.MAX} characters long`,
	},
	PHONE: {
		MIN: `Phone number must be at least ${VALIDATION_RULES.PHONE.MIN} characters long`,
		PREFIX: `Phone number must start with ${VALIDATION_RULES.PHONE.PREFIX}`,
	},
	ROLE: {
		INVALID: `Role must be one of: ${USER_ROLES.join(', ')}`,
	},
	GENERIC: {
		REQUIRED: 'This field is required',
		STRING: 'Field must be a string',
		NUMBER: 'Field must be a number',
		BOOLEAN: 'Field must be a boolean',
		DATE: 'Field must be a valid date',
	},
} as const;

export const BCRYPT_SALT_ROUNDS = 10;
export const TOKEN_EXPIRY_MINUTES = 15;
export const JWT_EXPIRY = '24h';

export const RATE_LIMITS = {
	SIGNUP: {
		MAX_REQUESTS: 5,
		WINDOW_MS: 15 * 60 * 1000, // 15 minutes
	},
	LOGIN: {
		MAX_REQUESTS: 10,
		WINDOW_MS: 15 * 60 * 1000, // 15 minutes
	},
	OTP: {
		MAX_REQUESTS: 3,
		WINDOW_MS: 60 * 1000, // 1 minute
	},
} as const;
