import { Request, Response, NextFunction } from 'express';
import { HttpStatusCode } from '../../utils/constants';
import { HttpError } from './error-types';

interface IResponseObject {
	statusCode: HttpStatusCode;
	message: string;
	data?: unknown;
}

export class ResponseObject implements IResponseObject {
	public readonly statusCode: HttpStatusCode;
	public readonly message: string;
	public readonly data?: unknown;

	constructor(statusCode: HttpStatusCode, message: string, data?: unknown) {
		const validStatusCodes: HttpStatusCode[] = [200, 201];
		if (!validStatusCodes.includes(statusCode)) {
			throw new HttpError(400, 'Invalid status code');
		}
		if (typeof message !== 'string' || message.trim() === '') {
			throw new HttpError(400, 'Invalid message');
		}
		this.statusCode = statusCode;
		this.message = message;
		this.data = data;
	}

	public static success<T>(
		statusCode: 200 | 201 | 500,
		message: string,
		data?: T
	): ResponseObject {
		return new ResponseObject(statusCode, message, data);
	}

	public send(res: Response): void {
		res
			.status(this.statusCode)
			.json({ message: this.message, data: this.data });
	}
}

export type ControllerFn = (
	req: Request,
	res: Response,
	next: NextFunction
) => Promise<void>;
