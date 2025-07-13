import * as z from 'zod';
import { ZodParams } from '../utils/constants';

export const CreateUserInputSchema = z.object({
	id: z.uuidv4(),
	username: z
		.string()
		.min(ZodParams.username.min, ZodParams.errors.username.min)
		.max(ZodParams.username.max, ZodParams.errors.username.max),
	email: z
		.email(ZodParams.errors.email.type)
		.min(ZodParams.email.min, ZodParams.errors.email.min)
		.max(ZodParams.email.max, ZodParams.errors.email.max),
	phoneNumb: z
		.string()
		.min(ZodParams.phoneNum.min, ZodParams.errors.phoneNum.min)
		.startsWith(ZodParams.phoneNum.prefix, ZodParams.errors.phoneNum.prefix),
	isGoogleLogin: z.boolean().default(ZodParams.defaults.isGoogleLogin),
	passwordHash: z.string().optional(),
	googleId: z.string().optional(),
	verifyToken: z.number(),
	verifyTokenExpiry: z.date(),
	verified: z.boolean().default(ZodParams.defaults.verified),
	role: z.enum(ZodParams.role.types).default(ZodParams.role.default),
	firstName: z.string(),
	lastName: z.string(),
	country: z.string(),
	isAvatarSelected: z.boolean().default(ZodParams.defaults.isAvatarSelected),
	avatar: z.string().optional(),
	isProfileDeleted: z.boolean().default(ZodParams.defaults.isProfileDeleted),
	currency: z.number().default(ZodParams.defaults.currency),
	pointsScored: z.number().default(ZodParams.defaults.pointsScored),
	isProfileOpen: z.boolean().default(ZodParams.defaults.isProfileOpen),
	createdAt: z.date().default(ZodParams.defaults.createdAt),
	updatedAt: z.date().default(ZodParams.defaults.updatedAt),
});

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
