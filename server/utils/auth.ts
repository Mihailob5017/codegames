import { v4 as uuid4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { bcryptSaltRounds } from './constants';
import jwt from 'jsonwebtoken';
import { JwtPayloadType } from '../types/dto/user-types';

export const generateId = (): string => uuid4();

export const generateToken = () => {
	return {
		token: Math.floor(Math.random() * 900000) + 100000,
		expiry: new Date(Date.now() + 15 * 60 * 1000),
	};
};

export const encryptPassword = (password: string): string => {
	return bcrypt.hashSync(password, bcryptSaltRounds);
};

export const comparePassword = (password: string, hash: string): boolean => {
	return bcrypt.compareSync(password, hash);
};

export const generateJWT = (jwtPayload: JwtPayloadType) => {
	const jwtSecret = process.env.JWT_SECRET as string;

	return jwt.sign(jwtPayload, jwtSecret);
};
