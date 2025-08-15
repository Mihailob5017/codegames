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
	country: string;
	isAvatarSelected: boolean;
	avatar?: string;
	isProfileDeleted: boolean;
	currency: number;
	pointsScored: number;
	isProfileOpen: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface PublicUserDTO {
	id: string;
	username: string;
	email: string;
	firstName: string;
	lastName: string;
	country: string;
	avatar?: string;
	currency: number;
	pointsScored: number;
	isProfileOpen: boolean;
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
	country: string;
	isGoogleLogin?: boolean;
	googleId?: string;
}

export interface UserUpdateDTO {
	firstName?: string;
	lastName?: string;
	country?: string;
	avatar?: string;
	isProfileOpen?: boolean;
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
	user: UserType;
}

export interface OTPVerificationDTO {
	otp: number;
}

export interface PasswordResetDTO {
	email: string;
	token: string;
	newPassword: string;
}

export interface RefreshTokenDTO {
	refreshToken: string;
}

export interface UserSearchDTO {
	query?: string;
	role?: Role;
	verified?: boolean;
	isProfileDeleted?: boolean;
	page?: number;
	limit?: number;
	sortBy?: 'createdAt' | 'username' | 'pointsScored';
	sortOrder?: 'asc' | 'desc';
}

export interface UserStatsDTO {
	totalUsers: number;
	verifiedUsers: number;
	unverifiedUsers: number;
	adminUsers: number;
	regularUsers: number;
	deletedUsers: number;
}

// Legacy types for backward compatibility - to be removed in next major version
/** @deprecated Use UserDTO instead */
export type UserType = UserDTO;

/** @deprecated Use UniqueUserFieldsDTO instead */
export type UniqueInputTypes = UniqueUserFieldsDTO;

/** @deprecated Use JwtPayloadDTO instead */
export type JwtPayloadType = JwtPayloadDTO;

/** @deprecated Use AuthResponseDTO instead */
export type CreateUserResponseType = AuthResponseDTO;
