import * as z from 'zod';
import { ZodParams } from '../utils/constants';
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// model User {
//   // Main information
//   id String @id @unique
//   username String @unique @db.VarChar(20)
//   email String @unique @db.VarChar(20)
//   phoneNumb String @unique @db.VarChar(20)
//   // Login-metadata
//   isGoogleLogin Boolean @default(false)
//   passwordHash String?
//   googleId String?
//   verifyToken Int
//   verifyTokenExpiry DateTime
//   verified Boolean @default(false)
//   role Role @default(user)
//   // User info
//   firstName String
//   lastName String
//   country String
//   isAvatarSelected Boolean @default(false)
//   avatar String?
//   isProfileDeleted Boolean @default(false)
//   // Leaderboard & Challenges
//   currency Int @default(0)
//   pointsScored Int @default(0)
//   isProfileOpen Boolean @default(true)
//   // ChallangesUnlocked etc
//   // History etc
//   // Timestamps
//   createdAt DateTime @default(now())
//   updatedAt DateTime @default(now()) @updatedAt
// }

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
	passwordHash: z.string().nullable().optional(),
	googleId: z.string().optional(),
	verifyToken: z.number(),
	verifyTokenExpiry: z.date(),
	verified: z.boolean().default(ZodParams.defaults.verified),
	role: z.enum(ZodParams.role.types).default(ZodParams.role.default),
	firstName: z.string(),
	lastName: z.string(),
	country: z.string(),
	isAvatarSelected: z.boolean().default(ZodParams.defaults.isAvatarSelected),
	avatar: z.string().or(z.null()).optional(),
	isProfileDeleted: z.boolean().default(ZodParams.defaults.isProfileDeleted),
	currency: z.number().default(ZodParams.defaults.currency),
	pointsScored: z.number().default(ZodParams.defaults.pointsScored),
	isProfileOpen: z.boolean().default(ZodParams.defaults.isProfileOpen),
	createdAt: z.date().default(ZodParams.defaults.createdAt),
	updatedAt: z.date().default(ZodParams.defaults.updatedAt),
});

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
