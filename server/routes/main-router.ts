import { Router, Request, Response } from 'express';
import { HttpError } from '../types/common/error-types';
import { HttpStatusCode } from '../utils/constants';

import { adminRouter, loginRouter } from './index';

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
		this.router.get('/health', (_req: Request, res: Response) => {
			res.status(HttpStatusCode.OK).json({
				status: 'healthy',
				timestamp: new Date().toISOString(),
				environment: this.config.nodeEnv,
			});
		});

		// API routes
		this.router.use(`${apiPrefix}/${this.config.adminRoute}`, adminRouter);
		this.router.use(`${apiPrefix}/auth`, loginRouter);

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
