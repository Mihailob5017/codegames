import dotenv from 'dotenv';
dotenv.config();

import { ExpressServerInstance } from './config/express-config';

import { PrismaServiceInstance } from './config/prisma-config';

const startServer = async () => {
	const port = process.env.PORT || 3000;

	if (!port) {
		throw new Error('PORT is not defined');
	}

	PrismaServiceInstance.connect();
	ExpressServerInstance.start();
};

startServer().catch((error) => {
	console.error('Failed to start server:', error);
	PrismaServiceInstance.disconnect();
	process.exit(1);
});
