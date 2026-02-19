import { Router, Request, Response } from "express";
import { HttpError } from "../types/common/error-types";
import { HttpStatusCode } from "../utils/constants";

import {
	authRouter,
	adminRouter,
	codeExecutionRouter,
	healthRouter,
} from "./index";

export interface RouterConfig {
	apiPrefix: string;
	nodeEnv: string;
	admin: string;
}

class MainRouter {
	private readonly router: Router;
	private readonly config: RouterConfig;

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

		this.router.use("/", healthRouter);
		this.router.use(`${apiPrefix}/${this.config.admin}`, adminRouter);
		this.router.use(`${apiPrefix}/auth`, authRouter);
		this.router.use(`${apiPrefix}/code-execution`, codeExecutionRouter);

		this.router.all("/{*any}", (req: Request, _res: Response) => {
			throw new HttpError(
				HttpStatusCode.NOT_FOUND,
				`Route ${req.originalUrl} not found`,
			);
		});
	}
}

export default MainRouter;
