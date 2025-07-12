import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../types/common/error-types';

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
