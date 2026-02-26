import { z } from "zod";

const envSchema = z.object({
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.optional()
		.default("development"),
	API_PORT: z.string().transform((val) => {
		const port = Number(val);
		if (Number.isNaN(port) || port < 1 || port > 65535) {
			throw new Error("API_PORT must be a valid port number (1-65535)");
		}
		return port;
	}),
	ADMIN_ROUTE: z.string().min(1, "ADMIN_ROUTE is required and cannot be empty"),
	API_VERSION: z.string().min(1, "API_VERSION is required and cannot be empty"),
	DATABASE_URL: z.url("DATABASE_URL must be a valid URL"),
	JWT_SECRET: z
		.string()
		.min(16, "JWT_SECRET must be at least 16 characters for security"),
	EMAIL_USER: z.email("EMAIL_USER must be a valid email address"),
	EMAIL_PASSWORD: z.string().min(1, "EMAIL_PASSWORD is required"),
	DUMMY_EMAIL: z.email("DUMMY_EMAIL must be a valid email address").optional(),
	PISTON_URL: z.url("PISTON_URL must be a valid URL"),
	MINIO_ENDPOINT: z.url("MINIO_ENDPOINT must be a valid URL"),
	MINIO_ROOT_USER: z.string().min(1, "MINIO_ROOT_USER is required"),
	MINIO_ROOT_PASSWORD: z.string().min(1, "MINIO_ROOT_PASSWORD is required"),
	MINIO_BUCKET: z.string().min(1, "MINIO_BUCKET is required").default("codegames"),
	MINIO_PUBLIC_URL: z.url("MINIO_PUBLIC_URL must be a valid URL"),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(env: Partial<NodeJS.ProcessEnv>): EnvConfig {
	return envSchema.parse(env);
}
