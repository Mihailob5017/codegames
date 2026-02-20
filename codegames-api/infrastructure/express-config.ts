import express, { Express } from "express";
import { EnvConfig } from "./env-config";
import { Server } from "node:http";

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
		console.log("TODO: Setting up routes...");
	}

	private setupErrorHandling() {
		console.log("TODO: Setting up error handling...");
	}

	public start(): void {
		this.server = this.app.listen(this.config.PORT, () => {
			console.log(`Server is running on port ${this.config.PORT}`);
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
