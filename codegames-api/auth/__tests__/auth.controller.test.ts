import {
	createMockNext,
	createMockRequest,
	createMockResponse,
} from "../../shared/test-utils/test-helpers";
import { ValidationError, AppError } from "../../shared/errors/app-error";

jest.mock("../auth.service");

import AuthService from "../auth.service";
import AuthController from "../auth.controller";

const MockAuthService = AuthService as jest.MockedClass<typeof AuthService>;

let mockService: jest.Mocked<AuthService>;

const validBody = {
	username: "johndoe",
	firstName: "John",
	lastName: "Doe",
	email: "john@example.com",
	password: "Secret1!",
};

describe("AuthController", () => {
	beforeAll(() => {
		mockService = MockAuthService.mock
			.instances[0] as jest.Mocked<AuthService>;
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("register", () => {
		it("returns 201 with success message for valid input", async () => {
			mockService.register.mockResolvedValue({} as any);

			const req = createMockRequest({ body: validBody });
			const res = createMockResponse();

			await AuthController.register(
				req as any,
				res as any,
				createMockNext(),
			);

			expect(mockService.register).toHaveBeenCalledWith(
				expect.objectContaining({ username: validBody.username }),
				undefined,
			);
			expect((res as any).status).toHaveBeenCalledWith(201);
			expect((res as any).json).toHaveBeenCalledWith({
				status: "success",
				message: "User registered successfully",
			});
		});

		it("throws ValidationError for missing required fields", async () => {
			const req = createMockRequest({ body: { email: "bad" } });
			const res = createMockResponse();

			await expect(
				AuthController.register(
					req as any,
					res as any,
					createMockNext(),
				),
			).rejects.toBeInstanceOf(ValidationError);

			expect(mockService.register).not.toHaveBeenCalled();
		});

		it("throws ValidationError when password lacks uppercase letter", async () => {
			const req = createMockRequest({
				body: { ...validBody, password: "secret1!" },
			});
			const res = createMockResponse();

			await expect(
				AuthController.register(
					req as any,
					res as any,
					createMockNext(),
				),
			).rejects.toBeInstanceOf(ValidationError);
		});

		it("propagates errors thrown by AuthService.register", async () => {
			mockService.register.mockRejectedValue(
				new AppError("Resource already exists", 409),
			);

			const req = createMockRequest({ body: validBody });
			const res = createMockResponse();

			await expect(
				AuthController.register(
					req as any,
					res as any,
					createMockNext(),
				),
			).rejects.toBeInstanceOf(AppError);
		});
	});
});
