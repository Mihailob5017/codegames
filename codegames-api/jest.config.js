/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	testMatch: ["**/*.test.ts"],
	clearMocks: true,
	// Count every source file so untested modules can't hide from the report.
	// index.ts (bootstrap) and prisma/ (migration scripts) are exempt.
	collectCoverageFrom: [
		"**/*.ts",
		"!**/__tests__/**",
		"!**/node_modules/**",
		"!dist/**",
		"!coverage/**",
		"!prisma/**",
		"!prisma.config.ts",
		"!index.ts",
	],
};
