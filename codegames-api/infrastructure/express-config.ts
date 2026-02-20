import express, { Express } from "express";

class ExpressServer {
	private readonly app: Express;

	constructor() {
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

	public start() {
		console.log("TODO: Starting server...");
	}

	public async stop() {
		console.log("TODO: Stopping server...");
	}
}

export default ExpressServer;
