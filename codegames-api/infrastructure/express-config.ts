import express, { Express } from "express";
import { EnvConfig } from "./env-config";
import { Server } from "node:http";
import { adminRouter } from "../admin";
import { codeRouter } from "../code";
import { uploadRouter } from "../upload";
import { errorMiddleware } from "../middleware/error-middleware";
import { requestLogger } from "../middleware/request-logger";
import helmet from "helmet";
import logger from "./logger";
import { generalRateLimiter } from "../middleware/rate-limit-middleware";
import { userRouter } from "../user";
class ExpressServer {
	private readonly app: Express;
	private readonly config: EnvConfig;
	private server: Server | null = null;

	constructor(config: EnvConfig) {
		this.config = config;
		this.app = express();
		this.setupMiddleware();
		this.setupRoutes();
		this.setupErrorHandling();
	}

	private setupMiddleware() {
		this.app.use(helmet());
		this.app.use(requestLogger);
		this.app.use(generalRateLimiter);
		this.app.use(express.json());
	}

	private setupRoutes() {
		const { API_VERSION, ADMIN_ROUTE } = this.config;
		this.app.use(`/api/${API_VERSION}${ADMIN_ROUTE}`, adminRouter);
		this.app.use(`/api/${API_VERSION}/code`, codeRouter);
		this.app.use(`/api/${API_VERSION}/upload`, uploadRouter);
		this.app.use(`/api/${API_VERSION}/user`, userRouter);
	}

	private setupErrorHandling() {
		this.app.use(errorMiddleware);
	}

	public start(): void {
		this.server = this.app.listen(this.config.API_PORT, () => {
			logger.info(`Server is running on port ${this.config.API_PORT}`);
		});
	}

	public stop(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.server) return resolve();
			this.server.close((err) => (err ? reject(err) : resolve()));
		});
	}
}

export default ExpressServer;
