import dotenv from "dotenv";
dotenv.config();

import { validateEnv } from "./config/env-validation";
import logger from "./config/logger-config";
import { ExpressServerInstance } from "./config/express-config";
import { PrismaServiceInstance } from "./config/prisma-config";

const env = validateEnv();

const startServer = async () => {
	logger.info("Connecting to database...");
	PrismaServiceInstance.connect();

	ExpressServerInstance.start();

	logger.info("Server started successfully", {
		port: env.PORT,
		environment: env.NODE_ENV,
		database: "connected",
	});
};

const gracefulShutdown = async () => {
	logger.info("Shutting down gracefully...");
	await PrismaServiceInstance.disconnect();
	process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

startServer().catch((error) => {
	logger.error("Failed to start server", {
		error: error.message,
		stack: error.stack,
	});
	PrismaServiceInstance.disconnect();
	process.exit(1);
});
