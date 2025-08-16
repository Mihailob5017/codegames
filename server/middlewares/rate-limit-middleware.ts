import rateLimit from 'express-rate-limit';

export const RateLimit = (windowDurationInSeconds: number, maxRequests: number = 1) =>
	rateLimit({
		windowMs: windowDurationInSeconds * 1000,
		max: maxRequests,
		message: {
			error: 'Too many requests from this IP',
			message: `Please try again after ${Math.ceil(windowDurationInSeconds / 60)} minute(s)`,
			retryAfter: windowDurationInSeconds,
		},
		standardHeaders: true,
		legacyHeaders: false,
		skipSuccessfulRequests: false,
		skipFailedRequests: false,
	});
