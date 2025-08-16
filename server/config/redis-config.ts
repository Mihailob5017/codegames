import { createClient } from 'redis';

type RedisClient = ReturnType<typeof createClient>;

class RedisService {
	private client: RedisClient;
	private isConnected: boolean = false;

	constructor() {
		this.client = this.createClient();
		// Don't auto-connect in constructor, let server explicitly connect
	}

	private createClient(): RedisClient {
		const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

		const client = createClient({
			url: redisUrl,
			socket: {
				connectTimeout: 5000,
			},
		});

		client.on('error', (error) => {
			console.error('Redis connection error:', error);
			this.isConnected = false;
		});

		client.on('connect', () => {
			console.log('Redis connected successfully');
			this.isConnected = true;
		});

		client.on('disconnect', () => {
			console.log('Redis disconnected');
			this.isConnected = false;
		});

		return client;
	}

	public async connect(): Promise<void> {
		try {
			if (!this.client.isOpen) {
				console.log('Connecting to Redis...');
				await this.client.connect();
				console.log('Redis connected successfully');
				this.isConnected = true;
			}
		} catch (error) {
			console.error('Failed to connect to Redis:', error);
			this.isConnected = false;
			// Don't throw - allow server to start even if Redis is unavailable
		}
	}

	public async connectWithRetry(maxRetries: number = 5, delayMs: number = 2000): Promise<void> {
		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				await this.connect();
				if (this.isHealthy()) {
					console.log(`Redis connected on attempt ${attempt}`);
					return;
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				console.log(`Redis connection attempt ${attempt}/${maxRetries} failed:`, errorMessage);
			}

			if (attempt < maxRetries) {
				console.log(`Retrying Redis connection in ${delayMs}ms...`);
				await new Promise(resolve => setTimeout(resolve, delayMs));
			}
		}

		console.warn('Redis connection failed after all retries. Server will continue without caching.');
	}

	public async get(key: string): Promise<string | null> {
		try {
			if (!this.isConnected || !this.client.isReady) {
				return null;
			}
			return await this.client.get(key);
		} catch (error) {
			console.error('Redis GET error:', error);
			return null;
		}
	}

	public async set(
		key: string,
		value: string,
		ttlSeconds?: number
	): Promise<boolean> {
		try {
			if (!this.isConnected || !this.client.isReady) {
				return false;
			}

			if (ttlSeconds) {
				await this.client.setEx(key, ttlSeconds, value);
			} else {
				await this.client.set(key, value);
			}
			return true;
		} catch (error) {
			console.error('Redis SET error:', error);
			return false;
		}
	}

	public async del(key: string): Promise<boolean> {
		try {
			if (!this.isConnected || !this.client.isReady) {
				return false;
			}
			await this.client.del(key);
			return true;
		} catch (error) {
			console.error('Redis DEL error:', error);
			return false;
		}
	}

	public async exists(key: string): Promise<boolean> {
		try {
			if (!this.isConnected || !this.client.isReady) {
				return false;
			}
			const result = await this.client.exists(key);
			return result === 1;
		} catch (error) {
			console.error('Redis EXISTS error:', error);
			return false;
		}
	}

	public isHealthy(): boolean {
		return this.isConnected && this.client.isReady;
	}

	public async disconnect(): Promise<void> {
		try {
			if (this.client.isReady) {
				await this.client.quit();
			}
		} catch (error) {
			console.error('Redis disconnect error:', error);
		}
	}
}

export const RedisServiceInstance = new RedisService();
export { RedisService };
