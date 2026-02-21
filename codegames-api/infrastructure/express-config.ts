import express, { Express } from "express";
import { EnvConfig } from "./env-config";
import { Server } from "node:http";
import { adminRouter } from "../admin";
import { codeRouter } from "../code";

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
		console.log("TODO: Setting up middleware...");
	}

	private setupRoutes() {
		const { API_VERSION, ADMIN_ROUTE } = this.config;

		this.app.use(`/api/${API_VERSION}${ADMIN_ROUTE}`, adminRouter);
		this.app.use(`/api/${API_VERSION}/code`, codeRouter);
	}

	private setupErrorHandling() {
		console.log("TODO: Setting up error handling...");
	}

	public start(): void {
		this.server = this.app.listen(this.config.API_PORT, () => {
			console.log(`Server is running on port ${this.config.API_PORT}`);
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
