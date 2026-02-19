import { Role } from '../../utils/constants';

export interface UserDTO {
	id: string;
	username: string;
	email: string;
	phoneNumb: string;
	isGoogleLogin: boolean;
	passwordHash?: string;
	googleId?: string;
	verifyToken?: number;
	verifyTokenExpiry?: Date;
	verified: boolean;
	role: Role;
	firstName: string;
	lastName: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface PublicUserDTO {
	id: string;
	username: string;
	email: string;
	firstName: string;
	lastName: string;
	role: Role;
	verified: boolean;
	createdAt: Date;
}

export interface UserLoginDTO {
	email: string;
	password: string;
}

export interface UserSignupDTO {
	username: string;
	email: string;
	phoneNumb: string;
	password: string;
	firstName: string;
	lastName: string;
	isGoogleLogin?: boolean;
	googleId?: string;
}

export interface UserUpdateDTO {
	firstName?: string;
	lastName?: string;
}

export interface UniqueUserFieldsDTO {
	id?: string;
	username?: string;
	email?: string;
	phoneNumb?: string;
}

export interface JwtPayloadDTO {
	id: string;
	username: string;
	email: string;
	phoneNumb: string;
	passwordHash: string;
	role: Role;
	iat?: number;
	exp?: number;
	iss?: string;
	aud?: string;
}

export interface AuthResponseDTO {
	jwt: string;
	refreshToken: string;
	user: UserDTO;
}

export interface OTPVerificationDTO {
	otp: number;
}

export interface RefreshTokenRequestDTO {
	refreshToken: string;
}

export interface RefreshTokenResponseDTO {
	jwt: string;
	refreshToken: string;
}

export interface RefreshTokenDTO {
	id: string;
	userId: string;
	token: string;
	expiresAt: Date;
	isRevoked: boolean;
	replacedBy?: string;
	userAgent?: string;
	ipAddress?: string;
	createdAt: Date;
	updatedAt: Date;
}

export type UserOperationType = 'signup' | 'login';

export interface UserExistenceCheckResult {
	exists: boolean;
	user?: UserDTO;
	message: string;
}
