import { PrismaClient } from '../generated/prisma/client';

class PrismaService {
	private static instance: PrismaService;
	private prismaClient: PrismaClient;
	private constructor() {
		this.prismaClient = new PrismaClient();
	}

	/**
	 * Retrieves the singleton instance of PrismaService.
	 * If an instance does not exist, it creates a new one.
	 *
	 * @returns {PrismaService} The singleton instance of PrismaService.
	 */

	public static getInstance(): PrismaService {
		return (
			PrismaService.instance ?? (PrismaService.instance = new PrismaService())
		);
	}

	/**
	 * Retrieves the PrismaClient instance used by the service.
	 *
	 * @returns The PrismaClient instance.
	 */
	public getClient(): PrismaClient {
		return this.prismaClient;
	}

	/**
	 * Establishes a connection to the Prisma database.
	 *
	 * This asynchronous method attempts to connect to the database using PrismaClient.
	 * If successful, it logs a confirmation message. If the connection fails, it logs
	 * the error and rethrows it for further handling.
	 *
	 * @throws Will throw an error if the connection to the database fails.
	 */

	public async connect(): Promise<void> {
		try {
			await this.prismaClient.$connect();
			console.log('Prisma connected successfully');
		} catch (error) {
			console.error('Error connecting to Prisma:', error);
			throw error; // Rethrow to allow calling code to handle errors
		}
	}

	// Optional: Disconnect from the database
	public async disconnect(): Promise<void> {
		await this.prismaClient.$disconnect();
		console.log('Prisma disconnected');
	}
}

export const PrismaServiceInstance = PrismaService.getInstance();
