import { Role } from '../../utils/constants';

/**
 * Complete user data transfer object containing all user fields
 */
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
	credits: number;
	pointsScored: number;
	isProfileOpen: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Public user data transfer object for displaying user information publicly
 * Contains only safe-to-expose user fields
 */
export interface PublicUserDTO {
	id: string;
	username: string;
	email: string;
	firstName: string;
	lastName: string;
	country: string;
	avatar?: string;
	credits: number;
	pointsScored: number;
	isProfileOpen: boolean;
	role: Role;
	verified: boolean;
	createdAt: Date;
}

/**
 * User login data transfer object
 */
export interface UserLoginDTO {
	email: string;
	password: string;
}

/**
 * User signup data transfer object
 */
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

/**
 * User update data transfer object for partial user updates
 */
export interface UserUpdateDTO {
	firstName?: string;
	lastName?: string;
	country?: string;
	avatar?: string;
	isProfileOpen?: boolean;
}

/**
 * Unique user fields data transfer object for user existence checks
 */
export interface UniqueUserFieldsDTO {
	id?: string;
	username?: string;
	email?: string;
	phoneNumb?: string;
}

/**
 * JWT payload data transfer object
 */
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

/**
 * Authentication response data transfer object
 */
export interface AuthResponseDTO {
	jwt: string;
	user: UserDTO;
}

/**
 * OTP verification data transfer object
 */
export interface OTPVerificationDTO {
	otp: number;
}

/**
 * Password reset data transfer object
 */
export interface PasswordResetDTO {
	email: string;
	token: string;
	newPassword: string;
}

/**
 * Refresh token data transfer object
 */
export interface RefreshTokenDTO {
	refreshToken: string;
}

/**
 * User search data transfer object for filtering and pagination
 */
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

/**
 * User statistics data transfer object
 */
export interface UserStatsDTO {
	totalUsers: number;
	verifiedUsers: number;
	unverifiedUsers: number;
	adminUsers: number;
	regularUsers: number;
	deletedUsers: number;
}

/**
 * Operation types for user existence checks
 */
export type UserOperationType = 'signup' | 'login';

/**
 * Enhanced user existence check result
 */
export interface UserExistenceCheckResult {
	exists: boolean;
	user?: UserDTO;
	message: string;
}

