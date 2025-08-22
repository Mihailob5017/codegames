import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth-middleware';
import { UserRepository } from '../repositories/login-repositories';
import { HttpError } from '../types/common/error-types';
import { RedisService, RedisServiceInstance } from '../config/redis-config';

export const VerifiedMiddleware = async (
	req: AuthRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		if (!req.userId) {
			return next(new HttpError(401, 'User authentication required'));
		}

		const redisService: RedisService = RedisServiceInstance;
		const userRepository = new UserRepository();
		const cacheKey = `user:verified:${req.userId}`;
		const cachedVerificationStatus = await redisService.get(cacheKey);

		if (cachedVerificationStatus !== null) {
			if (cachedVerificationStatus === 'false') {
				return next(new HttpError(403, 'Account verification required'));
			}
			return next();
		}

		const user = await userRepository.getUser(req.userId);
		if (!user) {
			return next(new HttpError(404, 'User not found'));
		}

		await redisService.set(cacheKey, user.verified.toString());

		if (!user.verified) {
			return next(new HttpError(403, 'Account verification required'));
		}

		next();
	} catch (error) {
		next(new HttpError(500, 'Verification check failed'));
	}
};
