import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../types/common/error-types';
import { verifyJWT } from '../utils/auth';

export interface AuthRequest extends Request {
	userId?: string;
}

export const AuthMiddleware = (
	req: AuthRequest,
	_res: Response,
	next: NextFunction
): void => {
	try {
		const token = extractTokenFromRequest(req);
		if (!token) {
			return next(new HttpError(401, 'Authentication token required'));
		}

		const decoded = verifyJWT(token);
		req.userId = decoded.id;
		
		next();
	} catch (error) {
		// verifyJWT already throws HttpError with appropriate messages
		next(error);
	}
};

export const extractTokenFromRequest = (request: Request): string | null => {
	const authorizationHeader = request.headers.authorization;

	if (authorizationHeader?.startsWith('Bearer ')) {
		return authorizationHeader.slice(7);
	}

	return request.cookies?.token ?? null;
};
