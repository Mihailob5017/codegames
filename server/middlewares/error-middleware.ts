import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../types/common/error-types';

/**
 * A middleware function that handles errors and sends a JSON response with
 * the error details.
 *
 * @param {HttpError} err - The error object to be handled.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next middleware function.
 */
export const errorMiddleware = (
	err: HttpError,
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const status = err.status || 500;
	const message = err.message || 'Something went wrong';
	const error = err.error || {};
	res.status(status).json({ message, error });
};
