// codegames-api/index.ts
import "dotenv/config"; // Must be first — loads .env before any other module runs

import ExpressServer from "./infrastructure/express-config";
import { initializeAppConfig } from "./infrastructure/app-config";
import PrismaService from "./infrastructure/prisma-config";
import { validateEnv } from "./infrastructure/env-config";
import logger from "./infrastructure/logger";
import UploadService from "./upload/upload.service";

type StartServerResult = {
	server: ExpressServer;
	prisma: PrismaService;
};

const startServer = async (): Promise<StartServerResult> => {
	const config = validateEnv(process.env);
	initializeAppConfig(config);

	const serverInstance = new ExpressServer(config);
	const prismaInstance = new PrismaService();

	await prismaInstance.connect();

	const uploadService = new UploadService();
	await uploadService.ensureBucket();

	serverInstance.start();

	return {
		server: serverInstance,
		prisma: prismaInstance,
	};
};

const gracefulShutdown = async (
	signal: string,
	{ server, prisma }: StartServerResult,
) => {
	logger.info(`Received ${signal}. Shutting down gracefully...`);
	await prisma.disconnect();
	await server.stop();
	process.exit(0);
};

startServer()
	.then((instances) => {
		process.on("SIGTERM", (signal) => gracefulShutdown(signal, instances));
		process.on("SIGINT", (signal) => gracefulShutdown(signal, instances));
	})
	.catch((error) => {
		console.error("Failed to start server", {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : "No stack trace",
		});
		process.exit(1);
	});
