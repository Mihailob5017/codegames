import type { TestCase } from "@prisma/client";
import CodePreparationService from "../code-preparation.service";

const service = new CodePreparationService();

// Only `input` matters for wrapping; it must be a JSON array of the call args.
const tc = (input: string): TestCase =>
	({
		id: "tc",
		problemId: "p",
		input,
		expectedOutput: "",
		isSample: true,
	}) as TestCase;

const USER_CODE = "function solution(a, b) { return a; }";

describe("CodePreparationService.wrapCode", () => {
	describe("JavaScript", () => {
		it("appends the user code, embeds inputs as a JSON array, and adds the runner", () => {
			const out = service.wrapCode(USER_CODE, "JAVASCRIPT", [
				tc("[[2,7,11,15],9]"),
			]);

			expect(out).toContain(USER_CODE);
			expect(out).toContain("const __inputs = [[[2,7,11,15],9]];");
			expect(out).toContain(
				"solution(...(Array.isArray(__args) ? __args : [__args]))",
			);
			expect(out).toContain(
				"process.stdout.write(JSON.stringify(__result)",
			);
		});

		it("embeds every test case in order", () => {
			const out = service.wrapCode(USER_CODE, "JAVASCRIPT", [
				tc("[1]"),
				tc("[2]"),
			]);
			expect(out).toContain("const __inputs = [[1],[2]];");
		});
	});

	describe("Python", () => {
		it("base64-encodes the inputs so they round-trip cleanly", () => {
			const inputs = [[2, 7, 11, 15], 9];
			const out = service.wrapCode(USER_CODE, "PYTHON", [
				tc(JSON.stringify(inputs)),
			]);

			const b64 = out.match(/b64decode\("([^"]+)"\)/)?.[1];
			expect(b64).toBeDefined();
			const decoded = JSON.parse(Buffer.from(b64!, "base64").toString());
			expect(decoded).toEqual([inputs]);
			expect(out).toContain("import json, base64");
			expect(out).toContain("solution(*(__args");
		});
	});

	describe("Java", () => {
		it("wraps user code in a Solution class and emits typed int[] / int literals", () => {
			const out = service.wrapCode(USER_CODE, "JAVA", [
				tc("[[2,7,11,15],9]"),
			]);

			expect(out).toContain("static class Solution {");
			expect(out).toContain("int[] __a0_0 = new int[]{2, 7, 11, 15};");
			expect(out).toContain("int __a0_1 = 9;");
			expect(out).toContain("sol.solution(__a0_0, __a0_1)");
		});

		it("promotes out-of-range integers to long with an L suffix", () => {
			const out = service.wrapCode(USER_CODE, "JAVA", [
				tc("[3000000000]"),
			]);
			expect(out).toContain("long __a0_0 = 3000000000L;");
		});

		it("uses double for non-integer numbers", () => {
			const out = service.wrapCode(USER_CODE, "JAVA", [tc("[1.5]")]);
			expect(out).toContain("double __a0_0 = 1.5;");
		});

		it("emits String literals with escaping and boolean literals", () => {
			const out = service.wrapCode(USER_CODE, "JAVA", [
				tc('["a\\"b", true]'),
			]);
			expect(out).toContain('String __a0_0 = "a\\"b";');
			expect(out).toContain("boolean __a0_1 = true;");
		});

		it("emits int[][] for nested integer arrays", () => {
			const out = service.wrapCode(USER_CODE, "JAVA", [
				tc("[[[1,2],[3,4]]]"),
			]);
			expect(out).toContain(
				"int[][] __a0_0 = new int[][]{{1, 2}, {3, 4}};",
			);
		});
	});

	describe("C#", () => {
		it("wraps user code and emits typed declarations and a Serialize call", () => {
			const out = service.wrapCode(USER_CODE, "CSHARP", [
				tc("[[1,2,3],true]"),
			]);
			expect(out).toContain("public class Solution {");
			expect(out).toContain("int[] __a0_0 = new int[]{1, 2, 3};");
			expect(out).toContain("bool __a0_1 = true;");
			expect(out).toContain("Console.WriteLine(Serialize(__r));");
		});
	});

	describe("C++", () => {
		it("emits vector<int> literals and a serialize(solution(...)) call", () => {
			const out = service.wrapCode(USER_CODE, "CPP", [tc("[[1,2,3],5]")]);
			expect(out).toContain("vector<int> __a0_0 = {1, 2, 3};");
			expect(out).toContain("int __a0_1 = 5;");
			expect(out).toContain("serialize(solution(__a0_0, __a0_1))");
		});

		it("emits vector<vector<int>> for nested integer arrays", () => {
			const out = service.wrapCode(USER_CODE, "CPP", [
				tc("[[[1,2],[3,4]]]"),
			]);
			expect(out).toContain(
				"vector<vector<int>> __a0_0 = {{1, 2}, {3, 4}};",
			);
		});

		it("falls back to an empty vector<int> for empty arrays", () => {
			const out = service.wrapCode(USER_CODE, "CPP", [tc("[[]]")]);
			expect(out).toContain("vector<int> __a0_0 = {};");
		});
	});
});
