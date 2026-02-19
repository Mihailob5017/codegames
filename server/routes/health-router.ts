import { Router, Request, Response as ExpressResponse } from 'express';
import { PrismaServiceInstance } from '../config/prisma-config';
import logger from '../config/logger-config';

export class HealthRouter {
    private router: Router;

    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        this.router.get('/health', this.healthCheck);
        this.router.get('/health/detailed', this.detailedHealthCheck);
    }

    private healthCheck = async (_req: Request, res: ExpressResponse): Promise<void> => {
        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        });
    };

    private detailedHealthCheck = async (_req: Request, res: ExpressResponse): Promise<void> => {
        try {
            const startTime = Date.now();

            const databaseHealth = await this.checkDatabase();
            const responseTime = Date.now() - startTime;

            const health = {
                status: databaseHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development',
                uptime: process.uptime(),
                responseTime: `${responseTime}ms`,
                services: {
                    database: databaseHealth,
                },
                memory: {
                    used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
                    total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
                },
            };

            const statusCode = databaseHealth.status === 'healthy' ? 200 : 503;

            if (statusCode === 503) {
                logger.warn('Health check failed', { health });
            }

            res.status(statusCode).json(health);
        } catch (error) {
            logger.error('Health check endpoint error', { error });
            res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    private async checkDatabase(): Promise<{
        status: 'healthy' | 'unhealthy';
        connected: boolean;
        responseTime?: string;
        error?: string;
    }> {
        try {
            const startTime = Date.now();
            const result = await PrismaServiceInstance.healthCheck();
            const responseTime = Date.now() - startTime;

            return {
                status: result.status,
                connected: PrismaServiceInstance.isConnectedToDatabase(),
                responseTime: `${responseTime}ms`,
            };
        } catch (error) {
            logger.error('Database health check failed', { error });
            return {
                status: 'unhealthy',
                connected: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    public getRouter(): Router {
        return this.router;
    }
}

export const healthRouter = new HealthRouter().getRouter();
