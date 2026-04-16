import prisma from "./prisma";
import logger from "./logger";

class PrismaService {
	private isConnected: boolean = false;

	public async connect(): Promise<void> {
		if (this.isConnected) return;
		await prisma.$connect();
		this.isConnected = true;
		logger.info("Database connected successfully");
	}

	public async disconnect(): Promise<void> {
		if (!this.isConnected) return;
		await prisma.$disconnect();
		this.isConnected = false;
		logger.info("Database disconnected successfully");
	}

	public async healthCheck(): Promise<boolean> {
		try {
			await prisma.$queryRaw`SELECT 1`;
			return true;
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			logger.error("Database health check failed", {
				error: err.message,
				stack: err.stack,
			});
			return false;
		}
	}
}

export default PrismaService;
