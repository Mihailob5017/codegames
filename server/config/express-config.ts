import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorMiddleware } from '../middlewares/error-middleware';
import { requestIdMiddleware, RequestWithId } from '../middlewares/request-id-middleware';
import { parseEnvVar, parseEnvInt } from '../utils/helpers';
import { RATE_LIMITS } from '../utils/constants';
import logger from './logger-config';

import { MainRouter } from '../routes';

export interface ServerConfig {
	port: number;
	corsOrigin: string | string[];
	adminRoute: string;
	apiPrefix: string;
	nodeEnv: string;
	rateLimitEnabled: boolean;
}

class ExpressServer {
	private static instance: ExpressServer;
	private app: Express;
	private config: ServerConfig;
	private mainRouter: MainRouter;

	private constructor() {
		this.config = this.loadConfiguration();
		this.app = express();
		this.mainRouter = new MainRouter({
			apiPrefix: this.config.apiPrefix,
			adminRoute: this.config.adminRoute,
			nodeEnv: this.config.nodeEnv,
		});
		this.setupMiddleware();
		this.setupRoutes();
		this.setupErrorHandling();
	}

	public static getInstance(): ExpressServer {
		if (!ExpressServer.instance) {
			ExpressServer.instance = new ExpressServer();
		}
		return ExpressServer.instance;
	}

	public getApp(): Express {
		return this.app;
	}

	public getConfig(): ServerConfig {
		return this.config;
	}

	public start(): void {
		const server = this.app.listen(this.config.port, () => {
			logger.info('Server started successfully', {
				port: this.config.port,
				environment: this.config.nodeEnv,
				apiBase: `/${this.config.apiPrefix}`,
			});
		});

		process.on('SIGTERM', () => {
			logger.info('SIGTERM received. Shutting down gracefully...');
			server.close(() => {
				logger.info('Process terminated');
				process.exit(0);
			});
		});

		process.on('SIGINT', () => {
			logger.info('SIGINT received. Shutting down gracefully...');
			server.close(() => {
				logger.info('Process terminated');
				process.exit(0);
			});
		});
	}

	private loadConfiguration(): ServerConfig {
		return {
			port: parseEnvInt('PORT', 3000),
			corsOrigin: process.env.CORS_ORIGIN?.split(',') || '*',
			adminRoute: parseEnvVar('ADMIN_ROUTE', 'admin'),
			apiPrefix: parseEnvVar('API_PREFIX', 'api/v1'),
			nodeEnv: parseEnvVar('NODE_ENV', 'development'),
			rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== 'false',
		};
	}

	private setupMiddleware(): void {
		// Request ID middleware - should be first to track all requests
		this.app.use(requestIdMiddleware);

		// Request logging middleware with correlation ID
		this.app.use((req: Request, res: Response, next) => {
			const requestWithId = req as RequestWithId;
			const startTime = Date.now();

			// Log request
			logger.info('Incoming request', {
				requestId: requestWithId.id,
				method: req.method,
				path: req.path,
				ip: req.ip,
				userAgent: req.get('user-agent'),
			});

			// Log response
			res.on('finish', () => {
				const duration = Date.now() - startTime;
				logger.info('Request completed', {
					requestId: requestWithId.id,
					method: req.method,
					path: req.path,
					statusCode: res.statusCode,
					duration: `${duration}ms`,
				});
			});

			next();
		});

		this.app.use(
			helmet({
				contentSecurityPolicy: {
					directives: {
						defaultSrc: ["'self'"],
						styleSrc: ["'self'", "'unsafe-inline'"],
						scriptSrc: ["'self'"],
						imgSrc: ["'self'", 'data:', 'https:'],
					},
				},
			})
		);

		// CORS
		this.app.use(
			cors({
				origin: this.config.corsOrigin,
				credentials: true,
				optionsSuccessStatus: 200,
			})
		);

		// Rate limiting
		if (this.config.rateLimitEnabled) {
			this.setupRateLimiting();
		}

		// Body parsing
		this.app.use(express.json({ limit: '10mb' }));
		this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
	}

	private setupRateLimiting(): void {
		const generalLimiter = rateLimit({
			windowMs: 15 * 60 * 1000,
			max: 100,
			message: 'Too many requests from this IP, please try again later.',
			standardHeaders: true,
			legacyHeaders: false,
		});

		// Signup rate limit
		const signupLimiter = rateLimit({
			windowMs: RATE_LIMITS.SIGNUP.WINDOW_MS,
			max: RATE_LIMITS.SIGNUP.MAX_REQUESTS,
			message: 'Too many signup attempts, please try again later.',
			standardHeaders: true,
			legacyHeaders: false,
		});

		// OTP rate limit
		const otpLimiter = rateLimit({
			windowMs: RATE_LIMITS.OTP.WINDOW_MS,
			max: RATE_LIMITS.OTP.MAX_REQUESTS,
			message: 'Too many OTP attempts, please try again later.',
			standardHeaders: true,
			legacyHeaders: false,
		});

		this.app.use(generalLimiter);
	}

	private setupRoutes(): void {
		this.app.use('/', this.mainRouter.getRouter());
	}

	private setupErrorHandling(): void {
		this.app.use(errorMiddleware);

		process.on(
			'unhandledRejection',
			(reason: unknown, promise: Promise<unknown>) => {
				logger.error('Unhandled Rejection', { reason, promise });
				if (this.config.nodeEnv === 'production') {
					process.exit(1);
				}
			}
		);

		process.on('uncaughtException', (error: Error) => {
			logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
			if (this.config.nodeEnv === 'production') {
				process.exit(1);
			}
		});
	}
}

export const ExpressServerInstance = ExpressServer.getInstance();
