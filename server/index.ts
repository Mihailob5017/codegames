import dontenv from 'dotenv';
dontenv.config();

import { ExpressServiceInstance } from './config/express-config';

import { PrismaServiceInstance } from './config/prisma-config';

const startServer = async () => {
	const port = process.env.PORT || 3000;

	if (!port) {
		throw new Error('PORT is not defined');
	}

	PrismaServiceInstance.connect();
	ExpressServiceInstance.start(Number(port));
};

startServer().catch((error) => {
	console.error('Failed to start server:', error);
	PrismaServiceInstance.disconnect();
	process.exit(1);
});
