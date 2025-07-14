import { v4 as uuid4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { bcryptSaltRounds } from './constants';
export const generateId = (): string => uuid4();

export const generateToken = () => {
	return {
		token: Math.floor(Math.random() * 900000) + 100000,
		expiry: new Date(Date.now() + 30 * 60 * 1000),
	};
};

export const encryptPassword = (password: string): string => {
	return bcrypt.hashSync(password, bcryptSaltRounds);
};
