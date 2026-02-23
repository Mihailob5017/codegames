import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { AppError, ValidationError } from "../errors/app-error";
import logger from "../infrastructure/logger";

export function errorMiddleware(
	err: Error,
	_req: Request,
	res: Response,
	_next: NextFunction,
): void {
	if (err instanceof ValidationError) {
		logger.warn("Validation error", {
			message: err.message,
			fieldErrors: err.fieldErrors,
		});
		res.status(err.statusCode).json({
			status: "error",
			message:
				Object.keys(err.fieldErrors).length > 0
					? err.fieldErrors
					: err.message,
		});
		return;
	}

	if (err instanceof AppError) {
		if (err.isOperational) {
			logger.warn("Operational error", {
				message: err.message,
				statusCode: err.statusCode,
			});
		} else {
			logger.error("Non-operational error", {
				message: err.message,
				stack: err.stack,
			});
		}
		res.status(err.statusCode).json({
			status: "error",
			message: err.message,
		});
		return;
	}

	if (err instanceof SyntaxError && "status" in err && (err as any).status === 400) {
		logger.warn("Malformed JSON body", { message: err.message });
		res.status(400).json({
			status: "error",
			message: "Invalid JSON in request body",
		});
		return;
	}

	if (err instanceof Prisma.PrismaClientKnownRequestError) {
		const prismaResponse = handlePrismaError(err);
		logger.warn("Prisma error", { code: err.code, meta: err.meta });
		res.status(prismaResponse.statusCode).json({
			status: "error",
			message: prismaResponse.message,
		});
		return;
	}

	if (err instanceof Prisma.PrismaClientValidationError) {
		logger.warn("Prisma validation error", { message: err.message });
		res.status(400).json({
			status: "error",
			message: "Invalid data provided",
		});
		return;
	}

	logger.error("Unexpected error", {
		message: err.message,
		stack: err.stack,
	});
	res.status(500).json({
		status: "error",
		message:
			process.env.NODE_ENV === "production"
				? "Internal server error"
				: err.message,
	});
}

function handlePrismaError(err: Prisma.PrismaClientKnownRequestError): {
	statusCode: number;
	message: string;
} {
	switch (err.code) {
		case "P2025":
			return { statusCode: 404, message: "Resource not found" };
		case "P2002":
			return { statusCode: 409, message: "Resource already exists" };
		case "P2003":
			return { statusCode: 400, message: "Related resource not found" };
		default:
			return { statusCode: 500, message: "Database error" };
	}
}
