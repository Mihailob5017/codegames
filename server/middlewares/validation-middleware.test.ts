import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody, validateQuery, validateParams, validate } from './validation-middleware';
import { HttpError } from '../types/common/error-types';

describe('Validation Middleware', () => {
	let req: Partial<Request>;
	let res: Partial<Response>;
	let next: jest.MockedFunction<NextFunction>;

	beforeEach(() => {
		req = {
			body: {},
			query: {},
			params: {},
			path: '/test',
			method: 'POST',
		};
		res = {};
		next = jest.fn();
	});

	describe('validateBody', () => {
		it('should pass validation with valid data', () => {
			const schema = z.object({
				name: z.string(),
				age: z.number(),
			});

			req.body = { name: 'John', age: 30 };

			const middleware = validateBody(schema);
			middleware(req as Request, res as Response, next);

			expect(next).toHaveBeenCalledWith();
			expect(req.body).toEqual({ name: 'John', age: 30 });
		});

		it('should fail validation with invalid data', () => {
			const schema = z.object({
				email: z.string().email(),
			});

			req.body = { email: 'not-an-email' };

			const middleware = validateBody(schema);
			middleware(req as Request, res as Response, next);

			expect(next).toHaveBeenCalledWith(expect.any(HttpError));
			const error = next.mock.calls[0][0] as unknown as HttpError;
			expect(error.status).toBe(400);
			expect(error.message).toContain('validation failed');
		});

		it('should transform data with schema transformations', () => {
			const schema = z.object({
				count: z.string().transform(Number),
			});

			req.body = { count: '42' };

			const middleware = validateBody(schema);
			middleware(req as Request, res as Response, next);

			expect(next).toHaveBeenCalledWith();
			expect(req.body).toEqual({ count: 42 });
		});
	});

	describe('validateQuery', () => {
		it('should pass validation with valid query params', () => {
			const schema = z.object({
				page: z.string().transform(Number),
				limit: z.string().transform(Number),
			});

			req.query = { page: '1', limit: '10' };

			const middleware = validateQuery(schema);
			middleware(req as Request, res as Response, next);

			expect(next).toHaveBeenCalledWith();
			expect(req.query).toEqual({ page: 1, limit: 10 });
		});

		it('should fail validation with invalid query params', () => {
			const schema = z.object({
				id: z.string().uuid(),
			});

			req.query = { id: 'not-a-uuid' };

			const middleware = validateQuery(schema);
			middleware(req as Request, res as Response, next);

			expect(next).toHaveBeenCalledWith(expect.any(HttpError));
		});
	});

	describe('validateParams', () => {
		it('should pass validation with valid route params', () => {
			const schema = z.object({
				id: z.string().uuid(),
			});

			req.params = { id: '550e8400-e29b-41d4-a716-446655440000' };

			const middleware = validateParams(schema);
			middleware(req as Request, res as Response, next);

			expect(next).toHaveBeenCalledWith();
			expect(req.params.id).toBe('550e8400-e29b-41d4-a716-446655440000');
		});

		it('should fail validation with invalid route params', () => {
			const schema = z.object({
				id: z.string().uuid(),
			});

			req.params = { id: 'invalid' };

			const middleware = validateParams(schema);
			middleware(req as Request, res as Response, next);

			expect(next).toHaveBeenCalledWith(expect.any(HttpError));
		});
	});

	describe('validate (combined)', () => {
		it('should validate all request parts successfully', () => {
			const middleware = validate({
				body: z.object({ name: z.string() }),
				query: z.object({ filter: z.string().optional() }),
				params: z.object({ id: z.string() }),
			});

			req.body = { name: 'Test' };
			req.query = { filter: 'active' };
			req.params = { id: '123' };

			middleware(req as Request, res as Response, next);

			expect(next).toHaveBeenCalledWith();
		});

		it('should collect all validation errors', () => {
			const middleware = validate({
				body: z.object({ email: z.string().email() }),
				query: z.object({ page: z.string().regex(/^\d+$/) }),
			});

			req.body = { email: 'invalid' };
			req.query = { page: 'abc' };

			middleware(req as Request, res as Response, next);

			expect(next).toHaveBeenCalledWith(expect.any(HttpError));
			const error = next.mock.calls[0][0] as unknown as HttpError;
			expect(error.error?.errors).toHaveLength(2);
		});
	});
});
