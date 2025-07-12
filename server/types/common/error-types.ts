export class HttpError extends Error {
	status: number;
	error: Record<string, unknown> = {};
	constructor(status: number, message: string, error?: {}) {
		super(message);
		this.status = status;
		if (error) {
			this.error = error;
		}
	}
}
