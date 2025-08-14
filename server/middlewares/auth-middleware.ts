import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../types/common/error-types';
import jwt from 'jsonwebtoken';
import { JwtPayloadType } from '../types/dto/user-types';
import { verifyJWT } from '../utils/auth';
export interface AuthRequest extends Request {
	token?: string;
}

export const AuthMiddleware = (
	req: AuthRequest,
	res: Response,
	next: NextFunction
) => {
	const token = extractTokenFromRequest(req);
	console.log(token);
	if (!token) {
		return next(new HttpError(401, 'Unauthorized from here'));
	}

	const secret = process.env.JWT_SECRET;

	if (!secret) {
		return next(new HttpError(500, 'JWT_SECRET is not defined'));
	}

	try {
		const decoded = verifyJWT(token);

		if (!decoded) {
			return next(new HttpError(401, 'Unauthorized'));
		}

		return next();
	} catch (error) {
		console.log(error);
		if (error instanceof jwt.JsonWebTokenError) {
			return next(new HttpError(401, 'Invalid token'));
		}

		if (error instanceof jwt.TokenExpiredError) {
			return next(new HttpError(401, 'Token expired'));
		}

		if (error instanceof jwt.NotBeforeError) {
			return next(new HttpError(401, 'Token not active'));
		}

		return next(new HttpError(500, 'Authentication error'));
	}
};

export const extractTokenFromRequest = (request: Request): string | null => {
	const authorizationHeader = request.headers.authorization;

	if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
		return authorizationHeader.slice(7);
	}

	return request.cookies?.token ?? null;
};
