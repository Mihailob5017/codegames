// codegames-api/auth/auth.dto.ts
import { z } from "zod";

export const RegisterSchema = z.object({
	username: z
		.string()
		.min(3, "Username must be at least 3 characters")
		.max(50),
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	email: z.email("Invalid email address"),
	password: z
		.string()
		.min(6, "Password must be at least 6 characters long")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[a-z]/, "Password must contain at least one lowercase letter")
		.regex(/[0-9]/, "Password must contain at least one number")
		.regex(
			/[@$!%*?&]/,
			"Password must contain at least one special character",
		),
	country: z.string().optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
