import winston from "winston";

const logger = winston.createLogger({
	// Read directly from process.env (not getAppConfig): the logger is created at
	// module load, before validateEnv/initializeAppConfig run at startup.
	level: process.env.NODE_ENV === "production" ? "info" : "debug",
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.errors({ stack: true }),
		winston.format.json(),
	),
	defaultMeta: { service: "codegames-api" },
	transports: [
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.simple(),
			),
		}),
	],
});

export default logger;
