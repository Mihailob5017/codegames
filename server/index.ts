import dotenv from 'dotenv';
dotenv.config();

import { validateEnv } from './config/env-validation';
import logger from './config/logger-config';
import { ExpressServerInstance } from './config/express-config';
import { PrismaServiceInstance } from './config/prisma-config';
import { RedisServiceInstance } from './config/redis-config';

// Validate environment variables first
const env = validateEnv();

const startServer = async () => {
	// Initialize services
	logger.info('Connecting to database...');
	PrismaServiceInstance.connect();

	// Connect to Redis with retry logic
	logger.info('Initializing Redis connection...');
	await RedisServiceInstance.connectWithRetry(5, 2000);

	ExpressServerInstance.start();

	const redisHealthy = RedisServiceInstance.isHealthy();
	logger.info('Server started successfully', {
		port: env.PORT,
		environment: env.NODE_ENV,
		database: 'connected',
		redis: redisHealthy ? 'connected' : 'disconnected (using database fallback)',
	});
};

const gracefulShutdown = async () => {
	logger.info('Shutting down gracefully...');
	await PrismaServiceInstance.disconnect();
	await RedisServiceInstance.disconnect();
	process.exit(0);
};

// Handle graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer().catch((error) => {
	logger.error('Failed to start server', { error: error.message, stack: error.stack });
	PrismaServiceInstance.disconnect();
	RedisServiceInstance.disconnect();
	process.exit(1);
});
