import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
	{
		ignores: ["dist", "node_modules", "coverage"],
	},
	{
		files: ["**/*.ts"],
		extends: [js.configs.recommended, tseslint.configs.recommended],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "module",
			globals: {
				...globals.node,
				...globals.jest,
			},
		},
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{ argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
			],
			"@typescript-eslint/no-explicit-any": "warn",
		},
	},
	{
		// Tests legitimately use `any` for mocks and import-only fixtures.
		files: ["**/__tests__/**", "**/*.test.ts"],
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unused-vars": "warn",
		},
	},
	// Formatting rules are owned by Prettier — keep this last so it wins.
	eslintConfigPrettier,
);
