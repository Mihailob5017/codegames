import { Router, Request, Response as ExpressResponse } from 'express';
import { PrismaServiceInstance } from '../config/prisma-config';
import { RedisServiceInstance } from '../config/redis-config';
import logger from '../config/logger-config';

export class HealthRouter {
    private router: Router;

    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        // Basic health check - fast endpoint for load balancers
        this.router.get('/health', this.healthCheck);

        // Detailed health check - includes all dependency checks
        this.router.get('/health/detailed', this.detailedHealthCheck);
    }

    /**
     * Basic health check endpoint
     * Returns 200 if server is up, minimal information
     */
    private healthCheck = async (_req: Request, res: ExpressResponse): Promise<void> => {
        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        });
    };

    /**
     * Detailed health check endpoint
     * Checks all services and returns comprehensive status
     * Returns 503 if any critical service is down
     */
    private detailedHealthCheck = async (_req: Request, res: ExpressResponse): Promise<void> => {
        try {
            const startTime = Date.now();

            // Check all services in parallel
            const [databaseHealth, redisHealth] = await Promise.allSettled([
                this.checkDatabase(),
                this.checkRedis(),
            ]);

            const responseTime = Date.now() - startTime;

            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development',
                uptime: process.uptime(),
                responseTime: `${responseTime}ms`,
                services: {
                    database: databaseHealth.status === 'fulfilled' ? databaseHealth.value : { status: 'unhealthy', error: 'Failed to check' },
                    redis: redisHealth.status === 'fulfilled' ? redisHealth.value : { status: 'unhealthy', error: 'Failed to check' },
                },
                memory: {
                    used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
                    total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
                },
            };

            // Determine overall health status
            const allServicesHealthy =
                health.services.database.status === 'healthy' &&
                health.services.redis.status === 'healthy';

            const statusCode = allServicesHealthy ? 200 : 503;
            health.status = allServicesHealthy ? 'healthy' : 'unhealthy';

            // Log unhealthy status
            if (!allServicesHealthy) {
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

    /**
     * Check database health
     */
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

    /**
     * Check Redis health
     */
    private async checkRedis(): Promise<{
        status: 'healthy' | 'unhealthy';
        connected: boolean;
        operational?: boolean;
        responseTime?: string;
        error?: string;
    }> {
        try {
            const startTime = Date.now();
            const connected = RedisServiceInstance.isHealthy();

            // Test Redis with a simple operation
            let operational = false;
            if (connected) {
                try {
                    await RedisServiceInstance.set('health:check', 'ok', 10);
                    const result = await RedisServiceInstance.get('health:check');
                    operational = result === 'ok';
                } catch (error) {
                    operational = false;
                }
            }

            const responseTime = Date.now() - startTime;

            return {
                status: connected && operational ? 'healthy' : 'unhealthy',
                connected,
                operational,
                responseTime: `${responseTime}ms`,
            };
        } catch (error) {
            logger.error('Redis health check failed', { error });
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
