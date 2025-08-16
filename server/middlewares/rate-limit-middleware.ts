import rateLimit from 'express-rate-limit';

export const RateLimit = (windowDurationInSeconds: number) =>
	rateLimit({
		windowMs: windowDurationInSeconds * 1000,
		max: 1,
		message:
			'Too many requests from this IP, please try again after ' +
			windowDurationInSeconds +
			' seconds.',
		standardHeaders: true,
		legacyHeaders: false,
	});
