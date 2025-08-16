import { Request, Response, NextFunction } from 'express';
import { createMockRequest, createMockResponse, createMockNext } from '../__tests__/utils/test-helpers';

// Mock express-rate-limit
jest.mock('express-rate-limit', () => {
	return jest.fn().mockReturnValue(jest.fn());
});

import { RateLimit } from './rate-limit-middleware';
import rateLimit from 'express-rate-limit';

describe('RateLimit middleware', () => {
	let req: Partial<Request>;
	let res: Partial<Response>;
	let next: NextFunction;
	const mockRateLimit = rateLimit as jest.MockedFunction<typeof rateLimit>;

	beforeEach(() => {
		req = createMockRequest();
		res = createMockResponse();
		next = createMockNext();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('RateLimit function', () => {
		it('should create rate limiter with correct window duration', () => {
			const windowSeconds = 300; // 5 minutes
			RateLimit(windowSeconds);

			expect(mockRateLimit).toHaveBeenCalledWith({
				windowMs: windowSeconds * 1000,
				max: 1,
				message: {
					error: 'Too many requests from this IP',
					message: `Please try again after ${Math.ceil(windowSeconds / 60)} minute(s)`,
					retryAfter: windowSeconds,
				},
				standardHeaders: true,
				legacyHeaders: false,
				skipSuccessfulRequests: false,
				skipFailedRequests: false,
			});
		});

		it('should create rate limiter with custom max requests', () => {
			const windowSeconds = 300;
			const maxRequests = 5;
			RateLimit(windowSeconds, maxRequests);

			expect(mockRateLimit).toHaveBeenCalledWith({
				windowMs: windowSeconds * 1000,
				max: maxRequests,
				message: {
					error: 'Too many requests from this IP',
					message: `Please try again after ${Math.ceil(windowSeconds / 60)} minute(s)`,
					retryAfter: windowSeconds,
				},
				standardHeaders: true,
				legacyHeaders: false,
				skipSuccessfulRequests: false,
				skipFailedRequests: false,
			});
		});

		it('should use default max requests of 1 when not specified', () => {
			const windowSeconds = 600; // 10 minutes
			RateLimit(windowSeconds);

			expect(mockRateLimit).toHaveBeenCalledWith(
				expect.objectContaining({
					max: 1,
				})
			);
		});

		it('should calculate correct retry message for different durations', () => {
			const testCases = [
				{ seconds: 60, expectedMinutes: 1 },
				{ seconds: 120, expectedMinutes: 2 },
				{ seconds: 300, expectedMinutes: 5 },
				{ seconds: 330, expectedMinutes: 6 }, // 5.5 minutes should round up to 6
			];

			testCases.forEach(({ seconds, expectedMinutes }) => {
				mockRateLimit.mockClear();
				RateLimit(seconds);

				expect(mockRateLimit).toHaveBeenCalledWith(
					expect.objectContaining({
						message: {
							error: 'Too many requests from this IP',
							message: `Please try again after ${expectedMinutes} minute(s)`,
							retryAfter: seconds,
						},
					})
				);
			});
		});

		it('should have standard headers enabled', () => {
			RateLimit(300);

			expect(mockRateLimit).toHaveBeenCalledWith(
				expect.objectContaining({
					standardHeaders: true,
					legacyHeaders: false,
				})
			);
		});

		it('should not skip any requests', () => {
			RateLimit(300);

			expect(mockRateLimit).toHaveBeenCalledWith(
				expect.objectContaining({
					skipSuccessfulRequests: false,
					skipFailedRequests: false,
				})
			);
		});

		it('should handle zero max requests', () => {
			const windowSeconds = 300;
			const maxRequests = 0;
			RateLimit(windowSeconds, maxRequests);

			expect(mockRateLimit).toHaveBeenCalledWith(
				expect.objectContaining({
					max: 0,
				})
			);
		});

		it('should handle very short window duration', () => {
			const windowSeconds = 30; // 30 seconds
			RateLimit(windowSeconds);

			expect(mockRateLimit).toHaveBeenCalledWith(
				expect.objectContaining({
					windowMs: 30000,
					message: {
						error: 'Too many requests from this IP',
						message: 'Please try again after 1 minute(s)',
						retryAfter: 30,
					},
				})
			);
		});

		it('should handle very long window duration', () => {
			const windowSeconds = 3600; // 1 hour
			RateLimit(windowSeconds);

			expect(mockRateLimit).toHaveBeenCalledWith(
				expect.objectContaining({
					windowMs: 3600000,
					message: {
						error: 'Too many requests from this IP',
						message: 'Please try again after 60 minute(s)',
						retryAfter: 3600,
					},
				})
			);
		});
	});
});