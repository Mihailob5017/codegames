import dotenv from 'dotenv';
dotenv.config();

import { ExpressServerInstance } from './config/express-config';
import { PrismaServiceInstance } from './config/prisma-config';
import { RedisServiceInstance } from './config/redis-config';

const startServer = async () => {
	const port = process.env.PORT || 3000;

	if (!port) {
		throw new Error('PORT is not defined');
	}

	// Initialize services
	console.log('Connecting to database...');
	PrismaServiceInstance.connect();
	
	// Connect to Redis with retry logic
	console.log('Initializing Redis connection...');
	await RedisServiceInstance.connectWithRetry(5, 2000);
	
	ExpressServerInstance.start();
	
	console.log(`✅ Server started on port ${port}`);
	console.log(`📊 Database: Connected`);
	console.log(`🔄 Redis: ${RedisServiceInstance.isHealthy() ? '✅ Connected' : '❌ Disconnected (using database fallback)'}`);
};

const gracefulShutdown = async () => {
	console.log('Shutting down gracefully...');
	await PrismaServiceInstance.disconnect();
	await RedisServiceInstance.disconnect();
	process.exit(0);
};

// Handle graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer().catch((error) => {
	console.error('Failed to start server:', error);
	PrismaServiceInstance.disconnect();
	RedisServiceInstance.disconnect();
	process.exit(1);
});
