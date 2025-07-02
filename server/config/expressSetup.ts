import express, { Express } from 'express';

/**
 * Sets up middleware and routes for the Express application.
 *
 * @param app - The Express application instance.
 * @returns The configured Express application instance.
 *
 * This function configures the Express application by adding JSON parsing middleware
 * and sets up a root router. It also indicates sections for additional routes such as
 * API, Admin, Login, Challenges, Leaderboard, and Profile.
 */

export const setupExpress = (app: Express): Express => {
	app.use(express.json());

	const rootRouter = express.Router();
	app.use('/', rootRouter);

	return app;
};
