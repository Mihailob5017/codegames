import { Request, Response, NextFunction } from 'express';
import { requestIdMiddleware, RequestWithId, getRequestId } from './request-id-middleware';

describe('Request ID Middleware', () => {
	let req: Partial<Request>;
	let res: Partial<Response>;
	let next: jest.MockedFunction<NextFunction>;

	beforeEach(() => {
		req = {
			headers: {},
		};
		res = {
			setHeader: jest.fn(),
		};
		next = jest.fn();
	});

	describe('requestIdMiddleware', () => {
		it('should generate a new request ID if not provided', () => {
			requestIdMiddleware(req as Request, res as Response, next);

			const requestWithId = req as RequestWithId;
			expect(requestWithId.id).toBeDefined();
			expect(typeof requestWithId.id).toBe('string');
			expect(requestWithId.id.length).toBeGreaterThan(0);
			expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', requestWithId.id);
			expect(next).toHaveBeenCalled();
		});

		it('should use client-provided request ID from header', () => {
			const clientRequestId = 'client-request-id-123';
			req.headers = { 'x-request-id': clientRequestId };

			requestIdMiddleware(req as Request, res as Response, next);

			const requestWithId = req as RequestWithId;
			expect(requestWithId.id).toBe(clientRequestId);
			expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', clientRequestId);
			expect(next).toHaveBeenCalled();
		});

		it('should generate UUID format for auto-generated IDs', () => {
			requestIdMiddleware(req as Request, res as Response, next);

			const requestWithId = req as RequestWithId;
			// UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
			const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			expect(requestWithId.id).toMatch(uuidRegex);
		});

		it('should call next middleware after setting request ID', () => {
			requestIdMiddleware(req as Request, res as Response, next);

			expect(next).toHaveBeenCalledTimes(1);
			expect(next).toHaveBeenCalledWith();
		});
	});

	describe('getRequestId', () => {
		it('should return request ID from request object', () => {
			const requestWithId = req as RequestWithId;
			requestWithId.id = 'test-request-id';

			const result = getRequestId(req as Request);

			expect(result).toBe('test-request-id');
		});

		it('should return "unknown" for requests without ID', () => {
			const result = getRequestId(req as Request);

			expect(result).toBe('unknown');
		});
	});
});
