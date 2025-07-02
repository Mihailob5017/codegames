import dontenv from 'dotenv';
dontenv.config();

import express from 'express';
import { PrismaClient } from './generated/prisma/client';
import { setupExpress, setupPrismaClient } from './config';

const prisma = new PrismaClient();
const startServer = async () => {
	const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
	const app = express();
	await setupPrismaClient(prisma);
	setupExpress(app).listen(port, () => {
		console.log(`Server is running on http://localhost:${port}`);
	});
};

startServer().catch((error) => {
	console.error('Failed to start server:', error);
	prisma.$disconnect();
	process.exit(1);
});
