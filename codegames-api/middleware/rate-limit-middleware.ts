import rateLimit from "express-rate-limit";

export const generalRateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // limit each IP to 100 requests per windowMs
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
});

export const codeSubmissionRateLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	limit: 10,
	standardHeaders: true,
	message:
		"Too many code submissions from this IP, please try again after a minute",
	legacyHeaders: false,
});
