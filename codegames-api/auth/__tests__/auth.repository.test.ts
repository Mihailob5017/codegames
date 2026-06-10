jest.mock("../../infrastructure/prisma", () => ({
	__esModule: true,
	default: {
		user: {
			findFirst: jest.fn(),
			create: jest.fn(),
		},
	},
}));

import prisma from "../../infrastructure/prisma";
import AuthRepository from "../auth.repository";
import type { RegisterUserData } from "../auth.repository";

const db = prisma as unknown as {
	user: Record<string, jest.Mock>;
};

describe("AuthRepository", () => {
	let repository: AuthRepository;

	beforeEach(() => {
		repository = new AuthRepository();
	});

	describe("findByUsernameOrEmail", () => {
		it("matches on username OR email and selects only the id", async () => {
			db.user.findFirst.mockResolvedValue({ id: "user-1" });

			const result = await repository.findByUsernameOrEmail(
				"johndoe",
				"john@example.com",
			);

			expect(result).toEqual({ id: "user-1" });
			expect(db.user.findFirst).toHaveBeenCalledWith({
				where: {
					OR: [
						{ username: "johndoe" },
						{ email: "john@example.com" },
					],
				},
				select: { id: true },
			});
		});

		it("returns null when no user matches", async () => {
			db.user.findFirst.mockResolvedValue(null);

			const result = await repository.findByUsernameOrEmail(
				"ghost",
				"ghost@example.com",
			);

			expect(result).toBeNull();
		});
	});

	describe("registerUser", () => {
		it("creates the user with the provided data", async () => {
			const data: RegisterUserData = {
				username: "johndoe",
				email: "john@example.com",
				passwordHash: "hashed-pw",
				firstName: "John",
				lastName: "Doe",
				profilePictureUrl: null,
				country: null,
			};
			db.user.create.mockResolvedValue({ id: "user-1", ...data });

			const result = await repository.registerUser(data);

			expect(result).toMatchObject({ id: "user-1" });
			expect(db.user.create).toHaveBeenCalledWith({ data });
		});
	});
});
