import env from "dotenv";

// Load services
import ExpressInstance from "./infrastructure/express-config";
import PrismaInstance from "./infrastructure/prisma-config";
import { validateEnv } from "./infrastructure/env-config";

env.config();


type StartServerResult = {
	server: ExpressInstance;
	prisma: PrismaInstance;
};

const startServer = async (): Promise<StartServerResult> => {
	const config = validateEnv(process.env);

	const serverInstance = new ExpressInstance(config);
	const prismaInstance = new PrismaInstance();

	await prismaInstance.connect();
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
	console.log(`Received ${signal}. Shutting down gracefully...`);
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
