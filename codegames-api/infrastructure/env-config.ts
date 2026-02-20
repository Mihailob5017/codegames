import { z } from "zod";

const envSchema = z.object({
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.optional()
		.default("development"),
	PORT: z.string().transform((val) => {
		const port = Number(val);
		if (Number.isNaN(port) || port < 1 || port > 65535) {
			throw new Error("PORT must be a valid port number (1-65535)");
		}
		return port;
	}),
	DATABASE_URL: z.url("DATABASE_URL must be a valid URL"),
	JWT_SECRET: z
		.string()
		.min(16, "JWT_SECRET must be at least 16 characters for security"),
	EMAIL_USER: z.email("EMAIL_USER must be a valid email address"),
	EMAIL_PASSWORD: z.string().min(1, "EMAIL_PASSWORD is required"),
	DUMMY_EMAIL: z.email("DUMMY_EMAIL must be a valid email address").optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(env: Partial<NodeJS.ProcessEnv>): EnvConfig {
	return envSchema.parse(env);
}
