import { Router, Request, Response } from 'express';
import { HttpError } from '../types/common/error-types';
import { HttpStatusCode } from '../utils/constants';
import { RedisServiceInstance } from '../config/redis-config';

import { adminRouter, loginRouter, codeExecutionRouter } from './index';

export interface RouterConfig {
	apiPrefix: string;
	adminRoute: string;
	nodeEnv: string;
}

class MainRouter {
	private router: Router;
	private config: RouterConfig;

	constructor(config: RouterConfig) {
		this.config = config;
		this.router = Router();
		this.setupRoutes();
	}

	public getRouter(): Router {
		return this.router;
	}

	private setupRoutes(): void {
		const apiPrefix = `/${this.config.apiPrefix}`;

		// Health check endpoint
		this.router.get('/health', async (_req: Request, res: Response) => {
			const redisHealthy = RedisServiceInstance.isHealthy();
			
			// Test Redis connection with a simple operation
			let redisTest = false;
			try {
				await RedisServiceInstance.set('health:check', 'ok', 10);
				const result = await RedisServiceInstance.get('health:check');
				redisTest = result === 'ok';
			} catch (error) {
				redisTest = false;
			}

			res.status(HttpStatusCode.OK).json({
				status: 'healthy',
				timestamp: new Date().toISOString(),
				environment: this.config.nodeEnv,
				services: {
					database: 'connected', // Assume connected if we got here
					redis: {
						connected: redisHealthy,
						operational: redisTest,
						status: redisTest ? 'connected' : 'disconnected'
					}
				},
				cache: {
					enabled: redisTest,
					fallback: redisTest ? 'disabled' : 'database'
				}
			});
		});

		// API routes
		this.router.use(`${apiPrefix}/${this.config.adminRoute}`, adminRouter);
		this.router.use(`${apiPrefix}/auth`, loginRouter);
		this.router.use(`${apiPrefix}/code-execution`, codeExecutionRouter);

		// 404 handler for undefined routes
		this.router.all('/{*any}', (req: Request, _res: Response) => {
			throw new HttpError(
				HttpStatusCode.NOT_FOUND,
				`Route ${req.originalUrl} not found`
			);
		});
	}
}

export default MainRouter;
