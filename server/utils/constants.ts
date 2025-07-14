export const HTTP_RESPONSE_CODE = {
	NOT_FOUND: 404,
	CREATED: 201,
	CONFLICT: 409,
	BAD_REQUEST: 400,
	SUCCESS: 200,
	UNAUTHORIZED: 401,
	SERVER_ERROR: 500,
};
export const enum HttpStatusCode {
	NOT_FOUND = 404,
	CREATED = 201,
	CONFLICT = 409,
	BAD_REQUEST = 400,
	SUCCESS = 200,
	UNAUTHORIZED = 401,
	SERVER_ERROR = 500,
}

export const APP_ERROR_MESSAGE = {
	serverError: 'Something went wrong, try again later',
	createdUser: 'User created successfully',
	eventCreated: 'Event created successfully',
	reviewCreated: 'Review created successfully',
	userAuthenticated: 'User Authenticated successfully',
	userReturned: 'User Returned successfully',
	usersReturned: 'Users Returned successfully',
	eventsReturned: 'Events Returned successfully',
	reviewsReturned: 'Reviews Returned successfully',
	userDoesntExist: 'User does not exist',
	eventDoesntExist: 'Event does not exist',
	invalidCredentials: 'Invalid user email or password',
	invalidEmail: 'Enter a valid email address',
};

export const ZodParams = {
	username: {
		min: 3,
		max: 15,
	},
	email: {
		min: 6,
		max: 45,
	},
	phoneNum: {
		min: 10,
		prefix: '+',
	},
	role: {
		types: ['user', 'admin'] as const,
		default: 'user' as const,
	},
	defaults: {
		isGoogleLogin: false,
		verified: false,
		isAvatarSelected: false,
		isProfileDeleted: false,
		isProfileOpen: true,
		currency: 0,
		pointsScored: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	errors: {
		username: {
			min: 'Username must be at least 3 characters long',
			max: 'Username must be at most 15 characters long',
		},
		email: {
			type: 'Email must be a valid email address',
			min: 'Email must be at least 6 characters long',
			max: 'Email must be at most 45 characters long',
		},
		phoneNum: {
			min: 'Phone number must be at least 10 characters long',
			prefix: 'Phone number must start with +',
		},
		password: {
			min: 'Password must be at least 6 characters long',
			max: 'Password must be at most 45 characters long',
		},
		role: {
			types: 'Role must be either user or admin',
			default: 'Role must be either user or admin',
		},
		generic: {
			string: 'Field must be a string',
			number: 'Field must be a number',
			boolean: 'Field must be a boolean',
			date: 'Field must be a date',
		},
	},
} as const;

export const bcryptSaltRounds = 10;

export type Role = (typeof ZodParams.role.types)[number];
