import { PrismaServiceInstance } from '../../config/prisma-config';
import { RefreshToken } from '../../generated/prisma';
import { HttpError } from '../../types/common/error-types';

export interface CreateRefreshTokenInput {
	userId: string;
	token: string;
	expiresAt: Date;
	userAgent?: string;
	ipAddress?: string;
}

export interface IRefreshTokenRepository {
	createRefreshToken(input: CreateRefreshTokenInput): Promise<RefreshToken>;
	findRefreshToken(token: string): Promise<RefreshToken | null>;
	revokeRefreshToken(token: string, replacedBy?: string): Promise<void>;
	revokeAllUserTokens(userId: string): Promise<void>;
	deleteExpiredTokens(): Promise<number>;
	findUserActiveTokens(userId: string): Promise<RefreshToken[]>;
}

export class RefreshTokenRepository implements IRefreshTokenRepository {
	/**
	 * Create a new refresh token in the database
	 */
	async createRefreshToken(
		input: CreateRefreshTokenInput
	): Promise<RefreshToken> {
		try {
			return await PrismaServiceInstance.getClient().refreshToken.create({
				data: {
					userId: input.userId,
					token: input.token,
					expiresAt: input.expiresAt,
					userAgent: input.userAgent,
					ipAddress: input.ipAddress,
				},
			});
		} catch (error) {
			throw new HttpError(
				500,
				`Failed to create refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Find a refresh token by its token string
	 */
	async findRefreshToken(token: string): Promise<RefreshToken | null> {
		try {
			return await PrismaServiceInstance.getClient().refreshToken.findUnique({
				where: { token },
				include: {
					user: true,
				},
			});
		} catch (error) {
			throw new HttpError(
				500,
				`Failed to find refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Revoke a refresh token (mark as revoked)
	 * @param token - The refresh token to revoke
	 * @param replacedBy - Optional: the new token that replaced this one (for token rotation)
	 */
	async revokeRefreshToken(token: string, replacedBy?: string): Promise<void> {
		try {
			await PrismaServiceInstance.getClient().refreshToken.update({
				where: { token },
				data: {
					isRevoked: true,
					replacedBy: replacedBy,
					updatedAt: new Date(),
				},
			});
		} catch (error) {
			throw new HttpError(
				500,
				`Failed to revoke refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Revoke all refresh tokens for a specific user
	 * Useful for logout all sessions or security concerns
	 */
	async revokeAllUserTokens(userId: string): Promise<void> {
		try {
			await PrismaServiceInstance.getClient().refreshToken.updateMany({
				where: {
					userId: userId,
					isRevoked: false,
				},
				data: {
					isRevoked: true,
					updatedAt: new Date(),
				},
			});
		} catch (error) {
			throw new HttpError(
				500,
				`Failed to revoke user tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Delete all expired refresh tokens from the database
	 * Should be run periodically as a cleanup job
	 * @returns The number of deleted tokens
	 */
	async deleteExpiredTokens(): Promise<number> {
		try {
			const result =
				await PrismaServiceInstance.getClient().refreshToken.deleteMany({
					where: {
						expiresAt: {
							lt: new Date(),
						},
					},
				});
			return result.count;
		} catch (error) {
			throw new HttpError(
				500,
				`Failed to delete expired tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Find all active (non-revoked, non-expired) tokens for a user
	 * Useful for displaying active sessions to the user
	 */
	async findUserActiveTokens(userId: string): Promise<RefreshToken[]> {
		try {
			return await PrismaServiceInstance.getClient().refreshToken.findMany({
				where: {
					userId: userId,
					isRevoked: false,
					expiresAt: {
						gt: new Date(),
					},
				},
				orderBy: {
					createdAt: 'desc',
				},
			});
		} catch (error) {
			throw new HttpError(
				500,
				`Failed to find user active tokens: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}
}
