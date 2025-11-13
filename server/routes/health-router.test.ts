import { Request, Response } from 'express';

const mockLogger = {
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
	debug: jest.fn(),
};

jest.mock('../config/prisma-config');
jest.mock('../config/redis-config');
jest.mock('../config/logger-config', () => mockLogger);

import { HealthRouter } from './health-router';
import { PrismaServiceInstance } from '../config/prisma-config';
import { RedisServiceInstance } from '../config/redis-config';

describe('HealthRouter', () => {
	let healthRouter: HealthRouter;
	let mockReq: Partial<Request>;
	let mockRes: Partial<Response>;
	let mockNext: jest.Mock;
	let jsonMock: jest.Mock;
	let statusMock: jest.Mock;

	beforeEach(() => {
		// Clear mock call history but keep implementations
		mockLogger.info.mockClear();
		mockLogger.warn.mockClear();
		mockLogger.error.mockClear();
		mockLogger.debug.mockClear();

		healthRouter = new HealthRouter();
		mockReq = {};
		mockNext = jest.fn();

		jsonMock = jest.fn();
		statusMock = jest.fn().mockReturnValue({ json: jsonMock });

		mockRes = {
			status: statusMock,
		};
	});

	describe('GET /health', () => {
		it('should return OK status with basic health info', async () => {
			const router = healthRouter.getRouter();
			const healthCheckHandler = router.stack.find(
				(layer: any) => layer.route?.path === '/health'
			)?.route?.stack[0].handle;

			await healthCheckHandler!(mockReq as Request, mockRes as Response, mockNext);

			expect(statusMock).toHaveBeenCalledWith(200);
			expect(jsonMock).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 'ok',
					timestamp: expect.any(String),
					uptime: expect.any(Number),
				})
			);
		});
	});

	describe('GET /health/detailed', () => {
		it('should return healthy status when all services are operational', async () => {
			(PrismaServiceInstance.healthCheck as jest.Mock).mockResolvedValue({
				status: 'healthy',
				details: { connected: true },
			});

			(PrismaServiceInstance.isConnectedToDatabase as jest.Mock).mockReturnValue(true);
			(RedisServiceInstance.isHealthy as jest.Mock).mockReturnValue(true);
			(RedisServiceInstance.set as jest.Mock).mockResolvedValue(undefined);
			(RedisServiceInstance.get as jest.Mock).mockResolvedValue('ok');

			const router = healthRouter.getRouter();
			const detailedHealthCheckHandler = router.stack.find(
				(layer: any) => layer.route?.path === '/health/detailed'
			)?.route?.stack[0].handle;

			await detailedHealthCheckHandler!(mockReq as Request, mockRes as Response, mockNext);

			expect(statusMock).toHaveBeenCalledWith(200);
			expect(jsonMock).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 'healthy',
					services: expect.objectContaining({
						database: expect.objectContaining({ status: 'healthy' }),
						redis: expect.objectContaining({ status: 'healthy' }),
					}),
				})
			);
		});

		it('should return unhealthy status (503) when database is down', async () => {
			(PrismaServiceInstance.healthCheck as jest.Mock).mockResolvedValue({
				status: 'unhealthy',
				details: { error: 'Connection refused' },
			});

			(PrismaServiceInstance.isConnectedToDatabase as jest.Mock).mockReturnValue(false);
			(RedisServiceInstance.isHealthy as jest.Mock).mockReturnValue(true);
			(RedisServiceInstance.set as jest.Mock).mockResolvedValue(undefined);
			(RedisServiceInstance.get as jest.Mock).mockResolvedValue('ok');

			const router = healthRouter.getRouter();
			const detailedHealthCheckHandler = router.stack.find(
				(layer: any) => layer.route?.path === '/health/detailed'
			)?.route?.stack[0].handle;

			await detailedHealthCheckHandler!(mockReq as Request, mockRes as Response, mockNext);

			expect(statusMock).toHaveBeenCalledWith(503);
			expect(jsonMock).toHaveBeenCalledWith(
				expect.objectContaining({
					status: 'unhealthy',
					services: expect.objectContaining({
						database: expect.objectContaining({ status: 'unhealthy' }),
					}),
				})
			);
		});

		it('should include response time metrics', async () => {
			(PrismaServiceInstance.healthCheck as jest.Mock).mockResolvedValue({
				status: 'healthy',
			});
			(PrismaServiceInstance.isConnectedToDatabase as jest.Mock).mockReturnValue(true);
			(RedisServiceInstance.isHealthy as jest.Mock).mockReturnValue(true);
			(RedisServiceInstance.set as jest.Mock).mockResolvedValue(undefined);
			(RedisServiceInstance.get as jest.Mock).mockResolvedValue('ok');

			const router = healthRouter.getRouter();
			const detailedHealthCheckHandler = router.stack.find(
				(layer: any) => layer.route?.path === '/health/detailed'
			)?.route?.stack[0].handle;

			await detailedHealthCheckHandler!(mockReq as Request, mockRes as Response, mockNext);

			expect(jsonMock).toHaveBeenCalledWith(
				expect.objectContaining({
					responseTime: expect.stringMatching(/\d+ms/),
					memory: expect.objectContaining({
						used: expect.any(String),
						total: expect.any(String),
					}),
				})
			);
		});
	});
});
