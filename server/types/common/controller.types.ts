import { Request, Response, NextFunction } from 'express';

export class ResponseObject {
	public statusCode: number;
	private message: string;
	private data: any;

	constructor(statusCode: number, message: string, data: any) {
		if (!statusCode || !message) {
			throw new Error('Status code and message are required');
		}
		this.statusCode = statusCode;
		this.message = message;
		this.data = data;
	}

	public static success(
		statusCode: number,
		message: string,
		data: any
	): ResponseObject {
		return new ResponseObject(statusCode, message, data);
	}
}

export class ErrorObject {
	public statusCode: number;
	private message: string;
	private error: any;

	constructor(statusCode: number, error: any, message?: string) {
		if (!statusCode) {
			throw new Error('Status code is required');
		}
		this.statusCode = statusCode;
		this.message = message || 'Something went wrong';
		this.error = error;
	}

	public static error(
		statusCode: number,
		error: any,
		message?: string
	): ErrorObject {
		return new ErrorObject(statusCode, error, message);
	}
}

export type ControllerFn = (
	req: Request,
	res: Response,
	next: NextFunction
) => Promise<void>;
