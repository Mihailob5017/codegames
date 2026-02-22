import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

class PrismaService {
	private readonly client: PrismaClient;
	private isConnected: boolean = false;

	constructor() {
		const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
		this.client = new PrismaClient({
			log: ["query", "info", "warn", "error"],
			adapter,
		});
	}

	public async connect() {
		if (this.isConnected) {
			return;
		}
		this.client
			.$connect()
			.then(() => {
				this.isConnected = true;
				console.log("Database connected successfully");
			})
			.catch((error) => {
				console.error("Failed to connect to database", {
					error: error.message,
					stack: error.stack,
				});
			});
	}
	public async disconnect() {
		if (!this.isConnected) {
			return;
		}
		await this.client.$disconnect();
		this.isConnected = false;
		console.log("Database disconnected successfully");
	}

	public async healthCheck() {
		try {
			await this.client.$queryRaw`SELECT 1`;
			return true;
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			console.error("Database health check failed", {
				error: err.message,
				stack: err.stack,
			});
			return false;
		}
	}
}

export default PrismaService;
