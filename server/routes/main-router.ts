import { Router, Request, Response } from 'express';
import { HttpError } from '../types/common/error-types';
import { HttpStatusCode } from '../utils/constants';

import { adminRouter, loginRouter, codeExecutionRouter, healthRouter } from './index';

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

		this.config.adminRoute = process.env.ADMIN_ROUTE || 'admin';

		// Health check routes (mounted at root level)
		this.router.use('/', healthRouter);

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
