type Role = 'admin' | 'user';

export type UserType = {
	id: string;
	username: string;
	email: string;
	phoneNumb: string;
	isGoogleLogin?: boolean;
	passwordHash?: string;
	googleId?: string;
	verifyToken: number;
	verifyTokenExpiry: Date;
	verified: boolean;
	role?: Role;
	firstName: string;
	lastName: string;
	country: string;
	isAvatarSelected?: boolean;
	avatar?: string;
	isProfileDeleted?: boolean;
	currency?: number;
	pointsScored?: number;
	isProfileOpen?: boolean;
};

export type UniqueInputTypes = {
	username: string;
	email: string;
};

export type JwtPayloadType = {
	id: string;
	username: string;
	email: string;
	passwordHash: string;
	phoneNumb: string;
};

export type CreateUserResponseType = {
	jwt: string;
	user: UserType;
};
