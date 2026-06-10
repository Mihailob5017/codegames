import { validateEnv } from "../env-config";

const validEnv = {
	NODE_ENV: "test",
	API_PORT: "4000",
	ADMIN_ROUTE: "/admin_secret_route",
	API_VERSION: "v1",
	DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
	JWT_SECRET: "supersecretjwtsecret",
	EMAIL_USER: "test@example.com",
	EMAIL_PASSWORD: "password",
	PISTON_URL: "http://localhost:2000",
	MINIO_ENDPOINT: "http://localhost:9000",
	MINIO_ROOT_USER: "minioadmin",
	MINIO_ROOT_PASSWORD: "minioadmin",
	MINIO_BUCKET: "codegames",
	MINIO_PUBLIC_URL: "http://localhost:9000",
	CORS_ORIGIN: "http://localhost:3000",
	SALT_ROUNDS: "10",
};

describe("validateEnv", () => {
	it("parses a valid env and returns SALT_ROUNDS as a number", () => {
		const config = validateEnv(validEnv);
		expect(config.API_PORT).toBe(4000);
		expect(config.SALT_ROUNDS).toBe(10);
	});

	it("throws when SALT_ROUNDS is missing", () => {
		const { SALT_ROUNDS: _omitted, ...withoutSalt } = validEnv;
		expect(() => validateEnv(withoutSalt)).toThrow();
	});

	it("throws when SALT_ROUNDS is not a number", () => {
		expect(() =>
			validateEnv({ ...validEnv, SALT_ROUNDS: "abc" }),
		).toThrow();
	});

	it("throws when SALT_ROUNDS is less than 1", () => {
		expect(() => validateEnv({ ...validEnv, SALT_ROUNDS: "0" })).toThrow();
	});

	it("throws when API_PORT is out of range", () => {
		expect(() => validateEnv({ ...validEnv, API_PORT: "99999" })).toThrow();
	});
});
