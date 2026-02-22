import type { Language, TestCase } from "@prisma/client";

class WrapperService {
	wrapCode(code: string, language: Language, testCases: TestCase[]): string {
		switch (language) {
			case "JAVASCRIPT":
				return this.wrapJavaScript(code, testCases);
			case "PYTHON":
				return this.wrapPython(code, testCases);
			case "JAVA":
				return this.wrapJava(code, testCases);
			case "CSHARP":
				return this.wrapCSharp(code, testCases);
			case "CPP":
				return this.wrapCpp(code, testCases);
		}
	}

	// ── JavaScript ───────────────────────────────────────────────────────────────
	// JSON.stringify output is valid JS syntax, embed directly as an array literal.

	private wrapJavaScript(code: string, testCases: TestCase[]): string {
		const inputs = JSON.stringify(testCases.map((tc) => JSON.parse(tc.input)));
		return `${code}

const __inputs = ${inputs};
for (const __args of __inputs) {
  try {
    const __result = solution(...(Array.isArray(__args) ? __args : [__args]));
    process.stdout.write(JSON.stringify(__result) + "\\n");
  } catch (__e) {
    process.stdout.write("ERROR: " + __e.message + "\\n");
  }
}`;
	}

	// ── Python ───────────────────────────────────────────────────────────────────
	// Base64-encode the JSON so we avoid all quote / newline escaping issues.

	private wrapPython(code: string, testCases: TestCase[]): string {
		const inputs = JSON.stringify(testCases.map((tc) => JSON.parse(tc.input)));
		const b64 = Buffer.from(inputs).toString("base64");
		return `import json, base64

${code}

__inputs = json.loads(base64.b64decode("${b64}").decode())
for __args in __inputs:
    try:
        __result = solution(*(__args if isinstance(__args, list) else [__args]))
        print(json.dumps(__result, separators=(',', ':')))
    except Exception as __e:
        print("ERROR: " + str(__e))`;
	}

	// ── Java ─────────────────────────────────────────────────────────────────────
	// Parse JSON in TypeScript at wrap-time; emit typed Java literals.
	// The user writes a single method named `solution`; we wrap it in a class.

	private wrapJava(code: string, testCases: TestCase[]): string {
		const testBlocks = testCases
			.map((tc, i) => {
				const args = JSON.parse(tc.input) as unknown[];
				const declarations = args
					.map((arg, j) => {
						const { javaType, literal } = this.toJavaLiteral(arg);
						return `      ${javaType} __a${i}_${j} = ${literal};`;
					})
					.join("\n");
				const argList = args.map((_, j) => `__a${i}_${j}`).join(", ");
				return `    {
${declarations}
      try {
        Object __r = sol.solution(${argList});
        System.out.println(__json(__r));
      } catch (Exception e) {
        System.out.println("ERROR: " + e.getMessage());
      }
    }`;
			})
			.join("\n");

		return `import java.util.*;
import java.util.stream.*;

public class Main {
  static class Solution {
${code
	.split("\n")
	.map((l) => "    " + l)
	.join("\n")}
  }

  static String __json(Object v) {
    if (v == null) return "null";
    if (v instanceof Boolean || v instanceof Integer || v instanceof Long) return v.toString();
    if (v instanceof Double || v instanceof Float) return v.toString();
    if (v instanceof String) return "\\"" + ((String)v).replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"") + "\\"";
    if (v instanceof int[]) {
      int[] a = (int[]) v;
      return "[" + Arrays.stream(a).mapToObj(Integer::toString).collect(Collectors.joining(",")) + "]";
    }
    if (v instanceof long[]) {
      long[] a = (long[]) v;
      return "[" + Arrays.stream(a).mapToObj(Long::toString).collect(Collectors.joining(",")) + "]";
    }
    if (v instanceof boolean[]) {
      boolean[] a = (boolean[]) v;
      StringBuilder sb = new StringBuilder("[");
      for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(","); sb.append(a[i]); }
      return sb.append("]").toString();
    }
    if (v instanceof String[]) {
      return "[" + Arrays.stream((String[])v)
        .map(s -> "\\"" + s.replace("\\\\","\\\\\\\\").replace("\\"","\\\\\\"") + "\\"")
        .collect(Collectors.joining(",")) + "]";
    }
    if (v instanceof int[][]) {
      int[][] a = (int[][]) v;
      return "[" + Arrays.stream(a)
        .map(r -> "[" + Arrays.stream(r).mapToObj(Integer::toString).collect(Collectors.joining(",")) + "]")
        .collect(Collectors.joining(",")) + "]";
    }
    if (v instanceof List) {
      List<?> list = (List<?>) v;
      return "[" + list.stream().map(Main::__json).collect(Collectors.joining(",")) + "]";
    }
    return v.toString();
  }

  public static void main(String[] args) {
    Solution sol = new Solution();
${testBlocks}
  }
}`;
	}

	private toJavaLiteral(value: unknown): { javaType: string; literal: string } {
		if (typeof value === "boolean") {
			return { javaType: "boolean", literal: String(value) };
		}
		if (typeof value === "number") {
			if (Number.isInteger(value)) {
				if (value > 2_147_483_647 || value < -2_147_483_648)
					return { javaType: "long", literal: value + "L" };
				return { javaType: "int", literal: String(value) };
			}
			return { javaType: "double", literal: String(value) };
		}
		if (typeof value === "string") {
			const esc = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
			return { javaType: "String", literal: `"${esc}"` };
		}
		if (Array.isArray(value)) {
			if (value.length === 0)
				return { javaType: "int[]", literal: "new int[]{}" };
			const first = value[0];
			if (
				typeof first === "number" &&
				Number.isInteger(first) &&
				value.every((v) => typeof v === "number" && Number.isInteger(v))
			) {
				return { javaType: "int[]", literal: `new int[]{${value.join(", ")}}` };
			}
			if (
				typeof first === "string" &&
				value.every((v) => typeof v === "string")
			) {
				const items = (value as string[])
					.map((s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`)
					.join(", ");
				return { javaType: "String[]", literal: `new String[]{${items}}` };
			}
			if (
				Array.isArray(first) &&
				value.every(
					(row) =>
						Array.isArray(row) &&
						(row as unknown[]).every(
							(v) => typeof v === "number" && Number.isInteger(v),
						),
				)
			) {
				const rows = (value as number[][])
					.map((row) => `{${row.join(", ")}}`)
					.join(", ");
				return { javaType: "int[][]", literal: `new int[][]{${rows}}` };
			}
		}
		return { javaType: "Object", literal: "null" };
	}

	// ── C# ───────────────────────────────────────────────────────────────────────

	private wrapCSharp(code: string, testCases: TestCase[]): string {
		const testBlocks = testCases
			.map((tc, i) => {
				const args = JSON.parse(tc.input) as unknown[];
				const declarations = args
					.map((arg, j) => {
						const { csType, literal } = this.toCSharpLiteral(arg);
						return `      ${csType} __a${i}_${j} = ${literal};`;
					})
					.join("\n");
				const argList = args.map((_, j) => `__a${i}_${j}`).join(", ");
				return `    {
${declarations}
      try {
        var __r = sol.solution(${argList});
        Console.WriteLine(Serialize(__r));
      } catch (Exception e) {
        Console.WriteLine("ERROR: " + e.Message);
      }
    }`;
			})
			.join("\n");

		return `using System;
using System.Collections.Generic;
using System.Linq;

public class Solution {
${code
	.split("\n")
	.map((l) => "  " + l)
	.join("\n")}
}

public class Program {
  static string Serialize(object val) {
    if (val == null) return "null";
    if (val is bool b) return b ? "true" : "false";
    if (val is string s) return "\\"" + s.Replace("\\\\", "\\\\\\\\").Replace("\\"", "\\\\\\"") + "\\"";
    if (val is int[] ia) return "[" + string.Join(",", ia) + "]";
    if (val is long[] la) return "[" + string.Join(",", la) + "]";
    if (val is double[] da) return "[" + string.Join(",", da) + "]";
    if (val is bool[] ba) return "[" + string.Join(",", ba.Select(x => x ? "true" : "false")) + "]";
    if (val is string[] sa) return "[" + string.Join(",", sa.Select(x => "\\"" + x + "\\"")) + "]";
    if (val is int[][] iaa) return "[" + string.Join(",", iaa.Select(r => "[" + string.Join(",", r) + "]")) + "]";
    if (val is IList<int> li) return "[" + string.Join(",", li) + "]";
    return val.ToString() ?? "null";
  }

  public static void Main(string[] args) {
    var sol = new Solution();
${testBlocks}
  }
}`;
	}

	private toCSharpLiteral(value: unknown): { csType: string; literal: string } {
		if (typeof value === "boolean") {
			return { csType: "bool", literal: value ? "true" : "false" };
		}
		if (typeof value === "number") {
			if (Number.isInteger(value))
				return { csType: "int", literal: String(value) };
			return { csType: "double", literal: String(value) };
		}
		if (typeof value === "string") {
			const esc = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
			return { csType: "string", literal: `"${esc}"` };
		}
		if (Array.isArray(value)) {
			if (value.length === 0)
				return { csType: "int[]", literal: "new int[]{}" };
			const first = value[0];
			if (
				typeof first === "number" &&
				Number.isInteger(first) &&
				value.every((v) => typeof v === "number" && Number.isInteger(v))
			) {
				return { csType: "int[]", literal: `new int[]{${value.join(", ")}}` };
			}
			if (
				typeof first === "string" &&
				value.every((v) => typeof v === "string")
			) {
				const items = (value as string[])
					.map((s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`)
					.join(", ");
				return { csType: "string[]", literal: `new string[]{${items}}` };
			}
		}
		return { csType: "object", literal: "null" };
	}

	// ── C++ ──────────────────────────────────────────────────────────────────────
	// Overloaded `serialize` functions cover the common return types.
	// The template handles vector<T> for any T that has a serialize overload.

	private wrapCpp(code: string, testCases: TestCase[]): string {
		const testBlocks = testCases
			.map((tc, i) => {
				const args = JSON.parse(tc.input) as unknown[];
				const declarations = args
					.map((arg, j) => {
						const { cppType, literal } = this.toCppLiteral(arg);
						return `  ${cppType} __a${i}_${j} = ${literal};`;
					})
					.join("\n");
				const argList = args.map((_, j) => `__a${i}_${j}`).join(", ");
				return `  {
${declarations}
    cout << serialize(solution(${argList})) << "\\n";
  }`;
			})
			.join("\n");

		return `#include <bits/stdc++.h>
using namespace std;

// serialize overloads — must come before user code so the template can see them
string serialize(int v)               { return to_string(v); }
string serialize(long long v)         { return to_string(v); }
string serialize(double v)            { return to_string(v); }
string serialize(bool v)              { return v ? "true" : "false"; }
string serialize(const string& v)     { return "\\"" + v + "\\""; }
template<typename T>
string serialize(const vector<T>& v) {
  string r = "[";
  for (size_t i = 0; i < v.size(); i++) { if (i) r += ","; r += serialize(v[i]); }
  return r + "]";
}

// User code
${code}

int main() {
${testBlocks}
  return 0;
}`;
	}

	private toCppLiteral(value: unknown): { cppType: string; literal: string } {
		if (typeof value === "boolean") {
			return { cppType: "bool", literal: value ? "true" : "false" };
		}
		if (typeof value === "number") {
			if (Number.isInteger(value))
				return { cppType: "int", literal: String(value) };
			return { cppType: "double", literal: String(value) };
		}
		if (typeof value === "string") {
			const esc = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
			return { cppType: "string", literal: `"${esc}"` };
		}
		if (Array.isArray(value)) {
			if (value.length === 0) return { cppType: "vector<int>", literal: "{}" };
			const first = value[0];
			if (
				typeof first === "number" &&
				Number.isInteger(first) &&
				value.every((v) => typeof v === "number" && Number.isInteger(v))
			) {
				return { cppType: "vector<int>", literal: `{${value.join(", ")}}` };
			}
			if (
				typeof first === "string" &&
				value.every((v) => typeof v === "string")
			) {
				const items = (value as string[])
					.map((s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`)
					.join(", ");
				return { cppType: "vector<string>", literal: `{${items}}` };
			}
			if (
				Array.isArray(first) &&
				value.every(
					(row) =>
						Array.isArray(row) &&
						(row as unknown[]).every(
							(v) => typeof v === "number" && Number.isInteger(v),
						),
				)
			) {
				const rows = (value as number[][])
					.map((row) => `{${row.join(", ")}}`)
					.join(", ");
				return { cppType: "vector<vector<int>>", literal: `{${rows}}` };
			}
		}
		return { cppType: "int", literal: "0" };
	}
}

export default WrapperService;
