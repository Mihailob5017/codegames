import { NextFunction, Request, Response } from "express";
import { z } from "zod";

export type ControllerType<T> = (
	req: Request,
	res: Response,
	next: NextFunction,
) => Promise<T>;

export const PaginationSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationParams = z.infer<typeof PaginationSchema>;

export interface PaginatedResult<T> {
	data: T[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}
