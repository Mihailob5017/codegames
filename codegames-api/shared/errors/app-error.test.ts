import {
	AppError,
	BadRequestError,
	ExternalServiceError,
	ForbiddenError,
	NotFoundError,
	UnauthorizedError,
	ValidationError,
} from "./app-error";

describe("AppError", () => {
	it("stores message and statusCode", () => {
		const err = new AppError("something went wrong", 418);
		expect(err.message).toBe("something went wrong");
		expect(err.statusCode).toBe(418);
		expect(err.isOperational).toBe(true);
	});

	it("allows isOperational to be set to false", () => {
		const err = new AppError("bug", 500, false);
		expect(err.isOperational).toBe(false);
	});

	it("is an instance of Error", () => {
		expect(new AppError("x", 500)).toBeInstanceOf(Error);
	});
});

describe("BadRequestError", () => {
	it("has statusCode 400", () => {
		expect(new BadRequestError().statusCode).toBe(400);
	});
	it("uses default message", () => {
		expect(new BadRequestError().message).toBe("Bad request");
	});
	it("accepts a custom message", () => {
		expect(new BadRequestError("custom").message).toBe("custom");
	});
	it("is an instance of AppError", () => {
		expect(new BadRequestError()).toBeInstanceOf(AppError);
	});
});

describe("NotFoundError", () => {
	it("has statusCode 404", () => {
		expect(new NotFoundError().statusCode).toBe(404);
	});
	it("uses default message", () => {
		expect(new NotFoundError().message).toBe("Resource not found");
	});
	it("is an instance of AppError", () => {
		expect(new NotFoundError()).toBeInstanceOf(AppError);
	});
});

describe("ValidationError", () => {
	it("has statusCode 400", () => {
		expect(new ValidationError("invalid").statusCode).toBe(400);
	});
	it("stores fieldErrors", () => {
		const fieldErrors = { email: ["Required"] };
		const err = new ValidationError("invalid", fieldErrors);
		expect(err.fieldErrors).toEqual(fieldErrors);
	});
	it("defaults fieldErrors to empty object", () => {
		expect(new ValidationError("invalid").fieldErrors).toEqual({});
	});
	it("is an instance of AppError", () => {
		expect(new ValidationError("x")).toBeInstanceOf(AppError);
	});
});

describe("UnauthorizedError", () => {
	it("has statusCode 401", () => {
		expect(new UnauthorizedError().statusCode).toBe(401);
	});
	it("uses default message", () => {
		expect(new UnauthorizedError().message).toBe("Unauthorized");
	});
	it("is an instance of AppError", () => {
		expect(new UnauthorizedError()).toBeInstanceOf(AppError);
	});
});

describe("ForbiddenError", () => {
	it("has statusCode 403", () => {
		expect(new ForbiddenError().statusCode).toBe(403);
	});
	it("uses default message", () => {
		expect(new ForbiddenError().message).toBe("Forbidden");
	});
	it("is an instance of AppError", () => {
		expect(new ForbiddenError()).toBeInstanceOf(AppError);
	});
});

describe("ExternalServiceError", () => {
	it("has statusCode 502", () => {
		expect(new ExternalServiceError().statusCode).toBe(502);
	});
	it("uses default message", () => {
		expect(new ExternalServiceError().message).toBe("External service error");
	});
	it("is an instance of AppError", () => {
		expect(new ExternalServiceError()).toBeInstanceOf(AppError);
	});
});
