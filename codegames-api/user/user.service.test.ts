import bcrypt from "bcryptjs";

jest.mock("bcryptjs");
jest.mock("../upload", () => ({
	UploadService: jest.fn().mockImplementation(() => ({
		upload: jest.fn(),
	})),
}));
jest.mock("./user.repository", () => ({
	UserRepository: jest.fn().mockImplementation(() => ({
		findByUsernameOrEmail: jest.fn(),
		registerUser: jest.fn(),
	})),
}));

import { UserService } from "./user.service";

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe("UserService", () => {
	let mockUploadService: { upload: jest.Mock };
	let mockUserRepository: {
		findByUsernameOrEmail: jest.Mock;
		registerUser: jest.Mock;
	};

	const baseInput = {
		username: "test-user",
		firstName: "Test",
		lastName: "User",
		email: "test@example.com",
		password: "Secret1!",
		country: "RS",
	};

	const profileImage = { originalname: "avatar.png" } as Express.Multer.File;

	beforeEach(() => {
		process.env.SALT_ROUNDS = "10";
		mockUploadService = {
			upload: jest.fn(),
		};
		mockUserRepository = {
			findByUsernameOrEmail: jest.fn(),
			registerUser: jest.fn(),
		};
		(UserService as any).uploadService = mockUploadService;
		(UserService as any).userRepository = mockUserRepository;
	});

	it("throws 409 before upload when user already exists", async () => {
		(mockedBcrypt.hash as unknown as jest.Mock).mockResolvedValue(
			"hashed-password",
		);
		mockUserRepository.findByUsernameOrEmail.mockResolvedValue({ id: "u1" });

		await expect(UserService.Register(baseInput, profileImage)).rejects.toEqual(
			expect.objectContaining({
				message: "Resource already exists",
				statusCode: 409,
			}),
		);

		expect(mockUploadService.upload).not.toHaveBeenCalled();
		expect(mockUserRepository.registerUser).not.toHaveBeenCalled();
	});

	it("hashes and existence check start in parallel", async () => {
		let hashStarted = false;
		let findStarted = false;
		let releaseHash!: (value: string) => void;
		let releaseFind!: (value: null) => void;

		(mockedBcrypt.hash as unknown as jest.Mock).mockImplementation(() => {
			hashStarted = true;
			return new Promise((resolve) => {
				releaseHash = resolve;
			});
		});

		mockUserRepository.findByUsernameOrEmail.mockImplementation(() => {
			findStarted = true;
			return new Promise((resolve) => {
				releaseFind = resolve;
			});
		});

		mockUploadService.upload.mockResolvedValue({
			url: "https://example.com/avatar.png",
		});
		mockUserRepository.registerUser.mockResolvedValue({ id: "created" });

		const registerPromise = UserService.Register(baseInput, profileImage);

		expect(hashStarted).toBe(true);
		expect(findStarted).toBe(true);

		releaseHash("hashed-password");
		releaseFind(null);

		await registerPromise;

		expect(mockUploadService.upload).toHaveBeenCalledWith(
			profileImage,
			"user-avatars",
		);
		expect(mockUserRepository.registerUser).toHaveBeenCalledWith({
			username: baseInput.username,
			email: baseInput.email,
			passwordHash: "hashed-password",
			firstName: baseInput.firstName,
			lastName: baseInput.lastName,
			profilePictureUrl: "https://example.com/avatar.png",
			country: baseInput.country,
		});
	});

	it("creates user without uploading when no profile image is provided", async () => {
		(mockedBcrypt.hash as unknown as jest.Mock).mockResolvedValue(
			"hashed-password",
		);
		mockUserRepository.findByUsernameOrEmail.mockResolvedValue(null);
		mockUserRepository.registerUser.mockResolvedValue({ id: "created" });

		await UserService.Register(baseInput);

		expect(mockUploadService.upload).not.toHaveBeenCalled();
		expect(mockUserRepository.registerUser).toHaveBeenCalledWith(
			expect.objectContaining({
				profilePictureUrl: null,
			}),
		);
	});
});
