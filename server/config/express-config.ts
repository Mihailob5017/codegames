import express, { Express } from 'express';
import { errorMiddleware } from '../middlewares/error-middleware';

import adminRouter from '../routes/admin-route';

class ExpressSingleton {
	private static instance: ExpressSingleton;
	private app: Express;
	private constructor() {
		this.app = express();
		this.setup();
	}

	/**
	 * Adds the admin route to the Express application.
	 *
	 * This method retrieves the `ADMIN_ROUTE` environment variable and uses it as
	 * the base path for the admin routes. The routes defined in the `adminRouter`
	 * are mounted under the specified path.
	 *
	 * @throws {Error} If the `ADMIN_ROUTE` environment variable is not defined.
	 */

	private addRoutes() {
		const adminRoute = process.env.ADMIN_ROUTE;
		if (!adminRoute) {
			throw new Error('ADMIN_ROUTE is not defined');
		}

		this.app.use(`/${adminRoute}`, adminRouter);
	}

	/**
	 * Returns the singleton instance of the ExpressSingleton class.
	 *
	 * If the instance has not been created yet, this method creates a new
	 * instance and assigns it to the static `instance` property.
	 *
	 * @returns The singleton instance of the ExpressSingleton class.
	 */
	public static getInstance(): ExpressSingleton {
		return (
			ExpressSingleton.instance ??
			(ExpressSingleton.instance = new ExpressSingleton())
		);
	}

	/**
	 * Returns the Express application instance.
	 *
	 * @returns The Express application instance.
	 */
	public getApp(): Express {
		return this.app;
	}

	/**
	 * Starts the Express application on the specified port.
	 *
	 * @param {number} port The port number to listen on.
	 */
	public start(port: number) {
		this.app.listen(port, () => {
			console.log(`Server started on port ${port}`);
		});
	}

	/**
	 * Adds the error middleware to the Express application.
	 *
	 * This method uses the `errorMiddleware` to catch and handle any errors that
	 * occur during the request-response cycle. The error middleware is added to
	 * the Express application in order to centralize error handling.
	 */
	private addErrorHandler() {
		this.app.use(errorMiddleware);
	}

	/**
	 * Configures the Express application.
	 *
	 * This method sets up the Express application by:
	 *
	 * 1. Adding the JSON parser middleware.
	 * 2. Adding the admin routes.
	 * 3. Adding the error middleware.
	 */
	private setup() {
		this.app.use(express.json());
		this.addRoutes();
		this.addErrorHandler();
	}
}

export const ExpressServiceInstance = ExpressSingleton.getInstance();
