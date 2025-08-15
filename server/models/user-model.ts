import * as z from 'zod';
import { 
	VALIDATION_RULES, 
	VALIDATION_ERRORS, 
	USER_DEFAULTS, 
	USER_ROLES 
} from '../utils/constants';

export const CreateUserInputSchema = z.object({
	id: z.string().uuid(),
	username: z
		.string()
		.min(VALIDATION_RULES.USERNAME.MIN, VALIDATION_ERRORS.USERNAME.MIN)
		.max(VALIDATION_RULES.USERNAME.MAX, VALIDATION_ERRORS.USERNAME.MAX)
		.regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
	email: z
		.string()
		.email(VALIDATION_ERRORS.EMAIL.INVALID)
		.min(VALIDATION_RULES.EMAIL.MIN, VALIDATION_ERRORS.EMAIL.MIN)
		.max(VALIDATION_RULES.EMAIL.MAX, VALIDATION_ERRORS.EMAIL.MAX)
		.toLowerCase(),
	phoneNumb: z
		.string()
		.min(VALIDATION_RULES.PHONE.MIN, VALIDATION_ERRORS.PHONE.MIN)
		.startsWith(VALIDATION_RULES.PHONE.PREFIX, VALIDATION_ERRORS.PHONE.PREFIX)
		.regex(/^\+[1-9]\d{9,14}$/, 'Invalid phone number format'),
	isGoogleLogin: z.boolean().default(USER_DEFAULTS.IS_GOOGLE_LOGIN),
	passwordHash: z.string().optional(),
	googleId: z.string().optional(),
	verifyToken: z.number().int().positive().optional(),
	verifyTokenExpiry: z.date().optional(),
	verified: z.boolean().default(USER_DEFAULTS.VERIFIED),
	role: z.enum(USER_ROLES).default(USER_DEFAULTS.ROLE),
	firstName: z
		.string()
		.min(1, 'First name is required')
		.max(50, 'First name must be at most 50 characters')
		.regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
	lastName: z
		.string()
		.min(1, 'Last name is required')
		.max(50, 'Last name must be at most 50 characters')
		.regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
	country: z
		.string()
		.min(2, 'Country code must be at least 2 characters')
		.max(3, 'Country code must be at most 3 characters')
		.toUpperCase(),
	isAvatarSelected: z.boolean().default(USER_DEFAULTS.IS_AVATAR_SELECTED),
	avatar: z.string().url('Avatar must be a valid URL').optional(),
	isProfileDeleted: z.boolean().default(USER_DEFAULTS.IS_PROFILE_DELETED),
	currency: z.number().int().min(0, 'Currency cannot be negative').default(USER_DEFAULTS.CURRENCY),
	pointsScored: z.number().int().min(0, 'Points cannot be negative').default(USER_DEFAULTS.POINTS_SCORED),
	isProfileOpen: z.boolean().default(USER_DEFAULTS.IS_PROFILE_OPEN),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

export const UserSignupSchema = z.object({
	username: z
		.string()
		.min(VALIDATION_RULES.USERNAME.MIN, VALIDATION_ERRORS.USERNAME.MIN)
		.max(VALIDATION_RULES.USERNAME.MAX, VALIDATION_ERRORS.USERNAME.MAX)
		.regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
	email: z
		.string()
		.email(VALIDATION_ERRORS.EMAIL.INVALID)
		.min(VALIDATION_RULES.EMAIL.MIN, VALIDATION_ERRORS.EMAIL.MIN)
		.max(VALIDATION_RULES.EMAIL.MAX, VALIDATION_ERRORS.EMAIL.MAX)
		.toLowerCase(),
	phoneNumb: z
		.string()
		.min(VALIDATION_RULES.PHONE.MIN, VALIDATION_ERRORS.PHONE.MIN)
		.startsWith(VALIDATION_RULES.PHONE.PREFIX, VALIDATION_ERRORS.PHONE.PREFIX)
		.regex(/^\+[1-9]\d{9,14}$/, 'Invalid phone number format'),
	password: z
		.string()
		.min(VALIDATION_RULES.PASSWORD.MIN, VALIDATION_ERRORS.PASSWORD.MIN)
		.max(VALIDATION_RULES.PASSWORD.MAX, VALIDATION_ERRORS.PASSWORD.MAX),
	firstName: z
		.string()
		.min(1, 'First name is required')
		.max(50, 'First name must be at most 50 characters')
		.regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
	lastName: z
		.string()
		.min(1, 'Last name is required')
		.max(50, 'Last name must be at most 50 characters')
		.regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
	country: z
		.string()
		.min(2, 'Country code must be at least 2 characters')
		.max(3, 'Country code must be at most 3 characters')
		.toUpperCase(),
	isGoogleLogin: z.boolean().default(false),
	googleId: z.string().optional(),
});

export const UserLoginSchema = z.object({
	email: z
		.string()
		.email(VALIDATION_ERRORS.EMAIL.INVALID)
		.toLowerCase(),
	password: z.string().min(1, 'Password is required'),
});

export const UserUpdateSchema = z.object({
	firstName: z
		.string()
		.min(1, 'First name is required')
		.max(50, 'First name must be at most 50 characters')
		.regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
		.optional(),
	lastName: z
		.string()
		.min(1, 'Last name is required')
		.max(50, 'Last name must be at most 50 characters')
		.regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
		.optional(),
	country: z
		.string()
		.min(2, 'Country code must be at least 2 characters')
		.max(3, 'Country code must be at most 3 characters')
		.toUpperCase()
		.optional(),
	avatar: z.string().url('Avatar must be a valid URL').optional(),
	isProfileOpen: z.boolean().optional(),
});

export const OTPVerificationSchema = z.object({
	otp: z.number().int().min(100000, 'OTP must be 6 digits').max(999999, 'OTP must be 6 digits'),
});

export const PasswordResetSchema = z.object({
	email: z
		.string()
		.email(VALIDATION_ERRORS.EMAIL.INVALID)
		.toLowerCase(),
	token: z.string().min(1, 'Reset token is required'),
	newPassword: z
		.string()
		.min(VALIDATION_RULES.PASSWORD.MIN, VALIDATION_ERRORS.PASSWORD.MIN)
		.max(VALIDATION_RULES.PASSWORD.MAX, VALIDATION_ERRORS.PASSWORD.MAX),
});

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
export type UserSignupInput = z.infer<typeof UserSignupSchema>;
export type UserLoginInput = z.infer<typeof UserLoginSchema>;
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
export type OTPVerificationInput = z.infer<typeof OTPVerificationSchema>;
export type PasswordResetInput = z.infer<typeof PasswordResetSchema>;
