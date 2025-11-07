import {
	RefreshTokenRepository,
	IRefreshTokenRepository,
} from '../../repositories/auth/refresh-token-repository';
import { UserRepository, IUserRepository } from '../../repositories/login/login-repositories';
import { HttpError } from '../../types/common/error-types';
import {
	JwtPayloadDTO,
	RefreshTokenResponseDTO,
	UserDTO,
} from '../../types/dto/user-types';
import {
	generateRefreshToken,
	generateAccessTokenFromRefresh,
} from '../../utils/auth';

export interface RefreshTokenMetadata {
	userAgent?: string;
	ipAddress?: string;
}

export interface IRefreshTokenService {
	createRefreshToken(
		userId: string,
		metadata?: RefreshTokenMetadata
	): Promise<string>;
	refreshAccessToken(
		refreshToken: string,
		metadata?: RefreshTokenMetadata
	): Promise<RefreshTokenResponseDTO>;
	revokeToken(refreshToken: string): Promise<void>;
	revokeAllUserTokens(userId: string): Promise<void>;
}

export class RefreshTokenService implements IRefreshTokenService {
	private refreshTokenRepository: IRefreshTokenRepository;
	private userRepository: IUserRepository;

	constructor(
		refreshTokenRepository?: IRefreshTokenRepository,
		userRepository?: IUserRepository
	) {
		this.refreshTokenRepository =
			refreshTokenRepository || new RefreshTokenRepository();
		this.userRepository = userRepository || new UserRepository();
	}

	/**
	 * Create a new refresh token for a user
	 * @param userId - The user's ID
	 * @param metadata - Optional metadata (userAgent, ipAddress)
	 * @returns The refresh token string
	 */
	async createRefreshToken(
		userId: string,
		metadata?: RefreshTokenMetadata
	): Promise<string> {
		try {
			// Generate a new secure refresh token
			const { token, expiresAt } = generateRefreshToken();

			// Store the refresh token in the database
			await this.refreshTokenRepository.createRefreshToken({
				userId,
				token,
				expiresAt,
				userAgent: metadata?.userAgent,
				ipAddress: metadata?.ipAddress,
			});

			return token;
		} catch (error) {
			throw new HttpError(
				500,
				`Failed to create refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Exchange a refresh token for a new access token and refresh token (token rotation)
	 * @param refreshToken - The current refresh token
	 * @param metadata - Optional metadata for the new refresh token
	 * @returns New access token and refresh token
	 */
	async refreshAccessToken(
		refreshToken: string,
		metadata?: RefreshTokenMetadata
	): Promise<RefreshTokenResponseDTO> {
		try {
			// Find the refresh token in the database
			const storedToken =
				await this.refreshTokenRepository.findRefreshToken(refreshToken);

			// Validate the token exists
			if (!storedToken) {
				throw new HttpError(401, 'Invalid refresh token');
			}

			// Check if token is revoked
			if (storedToken.isRevoked) {
				// If a revoked token is being reused, this could indicate token theft
				// Revoke all tokens for this user as a security measure
				await this.refreshTokenRepository.revokeAllUserTokens(
					storedToken.userId
				);
				throw new HttpError(
					401,
					'Refresh token has been revoked. All sessions have been terminated for security.'
				);
			}

			// Check if token is expired
			if (storedToken.expiresAt < new Date()) {
				throw new HttpError(401, 'Refresh token has expired');
			}

			// Get the user details
			const user = await this.userRepository.getUser(storedToken.userId);

			if (!user) {
				throw new HttpError(404, 'User not found');
			}

			if (!user.verified) {
				throw new HttpError(403, 'Account verification required');
			}

			if (user.isProfileDeleted) {
				throw new HttpError(403, 'Account has been deleted');
			}

			// Create JWT payload
			const jwtPayload: JwtPayloadDTO = {
				id: user.id,
				username: user.username,
				email: user.email,
				phoneNumb: user.phoneNumb,
				passwordHash: user.passwordHash as string,
				role: user.role,
			};

			// Generate new access token
			const newAccessToken = generateAccessTokenFromRefresh(jwtPayload);

			// Generate new refresh token (token rotation)
			const newRefreshToken = await this.createRefreshToken(
				user.id,
				metadata
			);

			// Revoke the old refresh token and link it to the new one
			await this.refreshTokenRepository.revokeRefreshToken(
				refreshToken,
				newRefreshToken
			);

			return {
				jwt: newAccessToken,
				refreshToken: newRefreshToken,
			};
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new HttpError(
				500,
				`Failed to refresh access token: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Revoke a specific refresh token
	 * @param refreshToken - The refresh token to revoke
	 */
	async revokeToken(refreshToken: string): Promise<void> {
		try {
			const storedToken =
				await this.refreshTokenRepository.findRefreshToken(refreshToken);

			if (!storedToken) {
				throw new HttpError(404, 'Refresh token not found');
			}

			if (storedToken.isRevoked) {
				throw new HttpError(400, 'Refresh token is already revoked');
			}

			await this.refreshTokenRepository.revokeRefreshToken(refreshToken);
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			throw new HttpError(
				500,
				`Failed to revoke token: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Revoke all refresh tokens for a user (logout from all devices)
	 * @param userId - The user's ID
	 */
	async revokeAllUserTokens(userId: string): Promise<void> {
		try {
			await this.refreshTokenRepository.revokeAllUserTokens(userId);
		} catch (error) {
			throw new HttpError(
				500,
				`Failed to revoke all user tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Clean up expired tokens from the database
	 * Should be called periodically (e.g., via a cron job)
	 * @returns Number of deleted tokens
	 */
	async cleanupExpiredTokens(): Promise<number> {
		try {
			return await this.refreshTokenRepository.deleteExpiredTokens();
		} catch (error) {
			throw new HttpError(
				500,
				`Failed to cleanup expired tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}
}
