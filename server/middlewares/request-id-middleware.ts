import { Request, Response as ExpressResponse, NextFunction, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Extended Request interface with request ID
 */
export interface RequestWithId extends Request {
    id: string;
}

/**
 * Request ID middleware
 * Adds a unique request ID to each incoming request
 * The ID can be provided by the client via X-Request-ID header,
 * or will be auto-generated if not provided
 *
 * Benefits:
 * - Request tracing across services
 * - Easier debugging in logs
 * - Better observability
 *
 * @example
 * app.use(requestIdMiddleware);
 *
 * // Later in your code
 * logger.info('Processing request', { requestId: req.id });
 */
export const requestIdMiddleware: RequestHandler = (
    req: Request,
    res: ExpressResponse,
    next: NextFunction
): void => {
    const requestWithId = req as RequestWithId;

    // Use client-provided request ID if available, otherwise generate new one
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();

    // Attach request ID to request object
    requestWithId.id = requestId;

    // Add request ID to response headers
    res.setHeader('X-Request-ID', requestId);

    next();
};

/**
 * Get request ID from request object
 * Helper function for type-safe access to request ID
 *
 * @param req - Express request object
 * @returns Request ID string
 */
export const getRequestId = (req: Request): string => {
    return (req as RequestWithId).id || 'unknown';
};
