import { Request, Response as ExpressResponse, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { HttpError } from '../types/common/error-types';
import logger from '../config/logger-config';

/**
 * Validation middleware for request body
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 *
 * @example
 * const loginSchema = z.object({
 *   email: z.string().email(),
 *   password: z.string().min(8),
 * });
 *
 * router.post('/login', validateBody(loginSchema), loginController);
 */
export function validateBody<T extends ZodSchema>(schema: T) {
    return (req: Request, _res: ExpressResponse, next: NextFunction) => {
        try {
            // Parse and validate the request body
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                logger.warn('Request body validation failed', {
                    path: req.path,
                    method: req.method,
                    issues: error.issues,
                });

                // Format error messages for better readability
                const formattedErrors = error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }));

                next(
                    new HttpError(400, 'Request body validation failed', {
                        errors: formattedErrors,
                    })
                );
            } else {
                next(error);
            }
        }
    };
}

/**
 * Validation middleware for query parameters
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 *
 * @example
 * const paginationSchema = z.object({
 *   page: z.string().transform(Number),
 *   limit: z.string().transform(Number),
 * });
 *
 * router.get('/users', validateQuery(paginationSchema), getUsersController);
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
    return (req: Request, _res: ExpressResponse, next: NextFunction) => {
        try {
            // Parse and validate query parameters
            const validated = schema.parse(req.query);
            req.query = validated as any;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                logger.warn('Query parameter validation failed', {
                    path: req.path,
                    method: req.method,
                    issues: error.issues,
                });

                const formattedErrors = error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }));

                next(
                    new HttpError(400, 'Query parameter validation failed', {
                        errors: formattedErrors,
                    })
                );
            } else {
                next(error);
            }
        }
    };
}

/**
 * Validation middleware for route parameters
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 *
 * @example
 * const idParamSchema = z.object({
 *   id: z.string().uuid(),
 * });
 *
 * router.get('/users/:id', validateParams(idParamSchema), getUserController);
 */
export function validateParams<T extends ZodSchema>(schema: T) {
    return (req: Request, _res: ExpressResponse, next: NextFunction) => {
        try {
            // Parse and validate route parameters
            const validated = schema.parse(req.params);
            req.params = validated as any;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                logger.warn('Route parameter validation failed', {
                    path: req.path,
                    method: req.method,
                    issues: error.issues,
                });

                const formattedErrors = error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }));

                next(
                    new HttpError(400, 'Route parameter validation failed', {
                        errors: formattedErrors,
                    })
                );
            } else {
                next(error);
            }
        }
    };
}

/**
 * Combined validation middleware for body, query, and params
 * @param schemas - Object containing schemas for body, query, and/or params
 * @returns Express middleware function
 *
 * @example
 * router.post('/users/:id/posts',
 *   validate({
 *     params: z.object({ id: z.string().uuid() }),
 *     body: z.object({ title: z.string(), content: z.string() }),
 *     query: z.object({ draft: z.string().optional() })
 *   }),
 *   createPostController
 * );
 */
export function validate(schemas: {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}) {
    return (req: Request, _res: ExpressResponse, next: NextFunction) => {
        try {
            const errors: Array<{ location: string; field: string; message: string }> = [];

            // Validate body if schema provided
            if (schemas.body) {
                try {
                    req.body = schemas.body.parse(req.body);
                } catch (error) {
                    if (error instanceof ZodError) {
                        error.issues.forEach((issue) => {
                            errors.push({
                                location: 'body',
                                field: issue.path.join('.'),
                                message: issue.message,
                            });
                        });
                    }
                }
            }

            // Validate query if schema provided
            if (schemas.query) {
                try {
                    const validated = schemas.query.parse(req.query);
                    req.query = validated as any;
                } catch (error) {
                    if (error instanceof ZodError) {
                        error.issues.forEach((issue) => {
                            errors.push({
                                location: 'query',
                                field: issue.path.join('.'),
                                message: issue.message,
                            });
                        });
                    }
                }
            }

            // Validate params if schema provided
            if (schemas.params) {
                try {
                    const validated = schemas.params.parse(req.params);
                    req.params = validated as any;
                } catch (error) {
                    if (error instanceof ZodError) {
                        error.issues.forEach((issue) => {
                            errors.push({
                                location: 'params',
                                field: issue.path.join('.'),
                                message: issue.message,
                            });
                        });
                    }
                }
            }

            // If there are any validation errors, return them all
            if (errors.length > 0) {
                logger.warn('Request validation failed', {
                    path: req.path,
                    method: req.method,
                    errors,
                });

                next(
                    new HttpError(400, 'Request validation failed', {
                        errors,
                    })
                );
            } else {
                next();
            }
        } catch (error) {
            next(error);
        }
    };
}
