import {
	AppError,
	ExternalServiceError,
	NotFoundError,
	ValidationError,
} from "../shared/errors/app-error";
import {
	createMockNext,
	createMockRequest,
	createMockResponse,
} from "../shared/test-utils/test-helpers";

jest.mock("../infrastructure/logger", () => ({
	__esModule: true,
	default: {
		warn: jest.fn(),
		error: jest.fn(),
		info: jest.fn(),
		debug: jest.fn(),
	},
}));

jest.mock("@prisma/client", () => {
	class PrismaClientKnownRequestError extends Error {
		code: string;
		meta: unknown;
		constructor(message: string, { code }: { code: string }) {
			super(message);
			this.code = code;
			this.meta = {};
		}
	}
	class PrismaClientValidationError extends Error {}
	return {
		Prisma: { PrismaClientKnownRequestError, PrismaClientValidationError },
	};
});

import { Prisma } from "@prisma/client";
import { errorMiddleware } from "./error-middleware";

describe("errorMiddleware", () => {
	const req = createMockRequest();
	const next = createMockNext();

	function runMiddleware(err: Error) {
		const res = createMockResponse();
		errorMiddleware(err, req as any, res as any, next);
		return res;
	}

	describe("ValidationError", () => {
		it("responds 400 with fieldErrors when present", () => {
			const err = new ValidationError("Invalid input", { code: ["Required"] });
			const res = runMiddleware(err);

			expect((res as any).status).toHaveBeenCalledWith(400);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "error",
				message: { code: ["Required"] },
			});
		});

		it("responds 400 with message string when fieldErrors is empty", () => {
			const err = new ValidationError("Invalid data");
			const res = runMiddleware(err);

			expect((res as any).status).toHaveBeenCalledWith(400);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "error",
				message: "Invalid data",
			});
		});
	});

	describe("AppError subclasses", () => {
		it("responds with NotFoundError statusCode 404", () => {
			const res = runMiddleware(new NotFoundError("Problem not found"));

			expect((res as any).status).toHaveBeenCalledWith(404);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "error",
				message: "Problem not found",
			});
		});

		it("responds with ExternalServiceError statusCode 502", () => {
			const res = runMiddleware(new ExternalServiceError("Piston down"));

			expect((res as any).status).toHaveBeenCalledWith(502);
		});
	});

	describe("Prisma errors", () => {
		it("responds 404 for P2025 (record not found)", () => {
			const err = new Prisma.PrismaClientKnownRequestError("Not found", {
				code: "P2025",
				clientVersion: "7",
			} as any);
			const res = runMiddleware(err);

			expect((res as any).status).toHaveBeenCalledWith(404);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "error",
				message: "Resource not found",
			});
		});

		it("responds 409 for P2002 (unique constraint violation)", () => {
			const err = new Prisma.PrismaClientKnownRequestError("Unique", {
				code: "P2002",
				clientVersion: "7",
			} as any);
			const res = runMiddleware(err);

			expect((res as any).status).toHaveBeenCalledWith(409);
		});

		it("responds 400 for P2003 (foreign key violation)", () => {
			const err = new Prisma.PrismaClientKnownRequestError("FK", {
				code: "P2003",
				clientVersion: "7",
			} as any);
			const res = runMiddleware(err);

			expect((res as any).status).toHaveBeenCalledWith(400);
		});

		it("responds 400 for PrismaClientValidationError", () => {
			const err = new Prisma.PrismaClientValidationError("bad data", {
				clientVersion: "7",
			});
			const res = runMiddleware(err);

			expect((res as any).status).toHaveBeenCalledWith(400);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "error",
				message: "Invalid data provided",
			});
		});
	});

	describe("unknown errors", () => {
		const OLD_ENV = process.env.NODE_ENV;

		afterEach(() => {
			process.env.NODE_ENV = OLD_ENV;
		});

		it("responds 500 with raw message in non-production", () => {
			process.env.NODE_ENV = "test";
			const err = new Error("Unexpected crash");
			const res = runMiddleware(err);

			expect((res as any).status).toHaveBeenCalledWith(500);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "error",
				message: "Unexpected crash",
			});
		});

		it("responds 500 with masked message in production", () => {
			process.env.NODE_ENV = "production";
			const err = new Error("Secret internal detail");
			const res = runMiddleware(err);

			expect((res as any).status).toHaveBeenCalledWith(500);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "error",
				message: "Internal server error",
			});
		});
	});
});
