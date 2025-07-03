import dontenv from 'dotenv';
dontenv.config();

import express from 'express';

import { setupExpress } from './config/expressSetup';
import { setupPrismaClient } from './config/prismaSetup';
import { prismaClient } from './utils/contants';

const startServer = async () => {
	const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
	const app = express();
	await setupPrismaClient(prismaClient);
	setupExpress(app).listen(port, () => {
		console.log(`Server is running on http://localhost:${port}`);
	});
};

startServer().catch((error) => {
	console.error('Failed to start server:', error);
	prismaClient.$disconnect();
	process.exit(1);
});
