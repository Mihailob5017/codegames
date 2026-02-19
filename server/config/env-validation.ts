import { z } from 'zod';
import logger from './logger-config';

const envSchema = z.object({
    PORT: z.string().transform((val) => {
        const port = Number(val);
        if (isNaN(port) || port < 1 || port > 65535) {
            throw new Error('PORT must be a valid port number (1-65535)');
        }
        return port;
    }),
    NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),

    DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

    JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters for security'),

    NODEMAILER_EMAIL: z.string().email('NODEMAILER_EMAIL must be a valid email address'),
    NODEMAILER_PASSWORD: z.string().min(1, 'NODEMAILER_PASSWORD is required'),
    DUMMY_EMAIL: z.string().email('DUMMY_EMAIL must be a valid email address').optional(),

    JUDGE0_API_URL: z.string().url('JUDGE0_API_URL must be a valid URL'),

    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).optional().default('info'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
    try {
        const validated = envSchema.parse(process.env);

        if (process.env.NODE_ENV !== 'test') {
            logger.info('Environment variables validated successfully', {
                nodeEnv: validated.NODE_ENV,
                port: validated.PORT,
                logLevel: validated.LOG_LEVEL,
            });
        }

        return validated;
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessage = 'Environment variable validation failed';
            const issues = error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            }));

            logger.error(errorMessage, { issues });

            console.error('\nEnvironment Variable Validation Failed:\n');
            issues.forEach(({ field, message }) => {
                console.error(`  - ${field}: ${message}`);
            });
            console.error('\nPlease check your .env file and ensure all required variables are set correctly.\n');

            throw new Error(errorMessage);
        }
        throw error;
    }
}

export function getEnv<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    const validated = envSchema.parse(process.env);
    return validated[key];
}
