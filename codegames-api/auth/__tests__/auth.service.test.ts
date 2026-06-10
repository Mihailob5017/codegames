import { initTestAppConfig } from "../../shared/test-utils/test-helpers";
import { ConflictError } from "../../shared/errors/app-error";

jest.mock("../auth.repository");
jest.mock("../../upload/upload.service");
jest.mock("bcryptjs");

import bcrypt from "bcryptjs";
import AuthRepository from "../auth.repository";
import UploadService from "../../upload/upload.service";
import AuthService from "../auth.service";

const MockRepo = AuthRepository as jest.MockedClass<typeof AuthRepository>;
const MockUpload = UploadService as jest.MockedClass<typeof UploadService>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

const input = {
	username: "johndoe",
	email: "john@example.com",
	password: "Secret1!",
	firstName: "John",
	lastName: "Doe",
};

describe("AuthService.register", () => {
	let service: AuthService;
	let repo: jest.Mocked<AuthRepository>;
	let upload: jest.Mocked<UploadService>;

	beforeAll(() => {
		initTestAppConfig({ SALT_ROUNDS: "10" });
	});

	beforeEach(() => {
		jest.clearAllMocks();
		service = new AuthService();
		repo = MockRepo.mock.instances[0] as jest.Mocked<AuthRepository>;
		upload = MockUpload.mock.instances[0] as jest.Mocked<UploadService>;
		mockBcrypt.hash.mockResolvedValue("hashed-pw" as never);
		repo.findByUsernameOrEmail.mockResolvedValue(null);
		repo.registerUser.mockResolvedValue({ id: "user-1" } as never);
	});

	it("hashes the password with the configured rounds and creates the user", async () => {
		await service.register(input);

		expect(mockBcrypt.hash).toHaveBeenCalledWith("Secret1!", 10);
		expect(repo.findByUsernameOrEmail).toHaveBeenCalledWith(
			"johndoe",
			"john@example.com",
		);
		expect(repo.registerUser).toHaveBeenCalledWith(
			expect.objectContaining({
				username: "johndoe",
				passwordHash: "hashed-pw",
				profilePictureUrl: null,
				country: null,
			}),
		);
		expect(upload.upload).not.toHaveBeenCalled();
	});

	it("throws a ConflictError when the user already exists", async () => {
		repo.findByUsernameOrEmail.mockResolvedValue({
			id: "existing",
		} as never);

		await expect(service.register(input)).rejects.toThrow(ConflictError);
		expect(repo.registerUser).not.toHaveBeenCalled();
	});

	it("uploads the avatar and stores its URL when an image is provided", async () => {
		upload.upload.mockResolvedValue({
			url: "https://cdn/avatar.png",
		} as never);
		const file = { originalname: "avatar.png" } as Express.Multer.File;

		await service.register(input, file);

		expect(upload.upload).toHaveBeenCalledWith(file, "user-avatars");
		expect(repo.registerUser).toHaveBeenCalledWith(
			expect.objectContaining({
				profilePictureUrl: "https://cdn/avatar.png",
			}),
		);
	});
});
