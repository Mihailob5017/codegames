import type { Request, Response, NextFunction } from "express";
import logger from "../infrastructure/logger";

export function requestLogger(
	req: Request,
	_res: Response,
	next: NextFunction,
): void {
	logger.info(`${req.method} ${req.path}`);
	next();
}
