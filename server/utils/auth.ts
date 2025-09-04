import { v4 as uuid4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { BCRYPT_SALT_ROUNDS, TOKEN_EXPIRY_MINUTES, JWT_EXPIRY } from './constants';
import { JwtPayloadDTO } from '../types/dto/user-types';
import { HttpError } from '../types/common/error-types';

export const generateId = (): string => {
	return uuid4();
};

export const generateToken = (): { token: number; expiry: Date } => {
	const token = Math.floor(Math.random() * 900000) + 100000;
	const expiry = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

	return { token, expiry };
};

export const encryptPassword = (password: string): string => {
	if (!password || typeof password !== 'string') {
		throw new HttpError(400, 'Invalid password provided');
	}

	return bcrypt.hashSync(password, BCRYPT_SALT_ROUNDS);
};

export const comparePassword = (password: string, hash: string): boolean => {
	if (
		!password ||
		!hash ||
		typeof password !== 'string' ||
		typeof hash !== 'string'
	) {
		return false;
	}
	return bcrypt.compareSync(password, hash);
};

export const generateJWT = (payload: JwtPayloadDTO): string => {
	const jwtSecret = process.env.JWT_SECRET;

	if (!jwtSecret) {
		throw new HttpError(500, 'JWT secret not configured');
	}

	if (!payload || !payload.id) {
		throw new HttpError(400, 'Invalid JWT payload');
	}

	return jwt.sign(payload, jwtSecret, {
		expiresIn: JWT_EXPIRY,
		issuer: 'codegames-api',
		audience: 'codegames-client',
	});
};

export const verifyJWT = (token: string): JwtPayloadDTO => {
	const jwtSecret = process.env.JWT_SECRET;

	if (!jwtSecret) {
		throw new HttpError(500, 'JWT secret not configured');
	}

	if (!token || typeof token !== 'string') {
		throw new HttpError(401, 'Invalid token provided');
	}

	try {
		return jwt.verify(token, jwtSecret, {
			issuer: 'codegames-api',
			audience: 'codegames-client',
		}) as JwtPayloadDTO;
	} catch (error) {
		if (error instanceof jwt.TokenExpiredError) {
			throw new HttpError(401, 'Token has expired');
		}
		if (error instanceof jwt.JsonWebTokenError) {
			throw new HttpError(401, 'Invalid token');
		}
		throw new HttpError(401, 'Token verification failed');
	}
};
