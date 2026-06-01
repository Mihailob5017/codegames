/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	testMatch: ["**/*.test.ts"],
	clearMocks: true,
	moduleNameMapper: {
		// `uuid` ships ESM-only; stub it so ts-jest can load modules that import it.
		"^uuid$": "<rootDir>/shared/test-utils/uuid.mock.ts",
	},
};
