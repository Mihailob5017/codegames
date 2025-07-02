/**
 * Configures and connects to the Prisma client.
 *
 * This function attempts to establish a connection to the database using the Prisma client.
 * Upon successful connection, a success message is logged.
 * If the connection fails, an error message is logged.
 *
 * @async
 * @throws Will log an error message if the connection to Prisma fails.
 */

import { PrismaClient } from '@prisma/client';

export const setupPrismaClient = async (prisma: PrismaClient) => {
	try {
		await prisma.$connect();
		console.log('Prisma connected suscessfully');
	} catch (error) {
		console.error('Error connecting to Prisma:', error);
	}
};
