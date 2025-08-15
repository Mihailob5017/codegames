import { PrismaClient, Prisma } from '../generated/prisma/client';
import { parseEnvVar, parseEnvBool } from '../utils/helpers';

export interface DatabaseConfig {
	url: string;
	logLevel: Prisma.LogLevel[];
	connectionTimeout: number;
	queryTimeout: number;
	enableLogging: boolean;
}

class DatabaseService {
	private static instance: DatabaseService;
	private client: PrismaClient;
	private config: DatabaseConfig;
	private isConnected: boolean = false;

	private constructor() {
		this.config = this.loadConfiguration();
		this.client = this.createClient();
		this.setupEventHandlers();
	}

	public static getInstance(): DatabaseService {
		if (!DatabaseService.instance) {
			DatabaseService.instance = new DatabaseService();
		}
		return DatabaseService.instance;
	}

	public getClient(): PrismaClient {
		return this.client;
	}

	public getConfig(): DatabaseConfig {
		return this.config;
	}

	public isConnectedToDatabase(): boolean {
		return this.isConnected;
	}

	public async connect(): Promise<void> {
		try {
			await this.client.$connect();
			this.isConnected = true;
			console.log('📊 Database connected successfully');
			
			// Verify connection with a simple query
			await this.healthCheck();
		} catch (error) {
			this.isConnected = false;
			console.error('❌ Database connection failed:', error);
			throw error;
		}
	}

	public async disconnect(): Promise<void> {
		try {
			await this.client.$disconnect();
			this.isConnected = false;
			console.log('📊 Database disconnected successfully');
		} catch (error) {
			console.error('❌ Database disconnection failed:', error);
			throw error;
		}
	}

	public async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
		try {
			const result = await this.client.$queryRaw`SELECT 1 as health_check`;
			return {
				status: 'healthy',
				details: {
					connected: this.isConnected,
					result,
					timestamp: new Date().toISOString(),
				},
			};
		} catch (error) {
			return {
				status: 'unhealthy',
				details: {
					connected: this.isConnected,
					error: error instanceof Error ? error.message : 'Unknown error',
					timestamp: new Date().toISOString(),
				},
			};
		}
	}

	public async executeTransaction<T>(
		operations: (client: Prisma.TransactionClient) => Promise<T>,
		options?: {
			maxWait?: number;
			timeout?: number;
			isolationLevel?: Prisma.TransactionIsolationLevel;
		}
	): Promise<T> {
		return this.client.$transaction(operations, {
			maxWait: options?.maxWait || 5000,
			timeout: options?.timeout || 10000,
			isolationLevel: options?.isolationLevel,
		});
	}

	private loadConfiguration(): DatabaseConfig {
		const logLevelStr = process.env.DATABASE_LOG_LEVEL || 'warn';
		const logLevels = logLevelStr.split(',').map(level => 
			level.trim() as Prisma.LogLevel
		);

		return {
			url: parseEnvVar('DATABASE_URL'),
			logLevel: logLevels,
			connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '10000'),
			queryTimeout: parseInt(process.env.DATABASE_QUERY_TIMEOUT || '10000'),
			enableLogging: parseEnvBool('DATABASE_ENABLE_LOGGING', false),
		};
	}

	private createClient(): PrismaClient {
		return new PrismaClient({
			datasources: {
				db: {
					url: this.config.url,
				},
			},
			log: this.config.enableLogging ? this.config.logLevel : [],
			errorFormat: 'pretty',
		});
	}

	private setupEventHandlers(): void {
		// Graceful shutdown handling
		process.on('SIGINT', async () => {
			console.log('🛑 Received SIGINT, disconnecting from database...');
			await this.disconnect();
		});

		process.on('SIGTERM', async () => {
			console.log('🛑 Received SIGTERM, disconnecting from database...');
			await this.disconnect();
		});
	}
}

export const PrismaServiceInstance = DatabaseService.getInstance();
