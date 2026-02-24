import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

interface SeedTestCase {
	input: string;
	expectedOutput: string;
	isSample: boolean;
}

interface SeedStarterCode {
	language: "JAVASCRIPT" | "PYTHON" | "JAVA" | "CSHARP" | "CPP";
	code: string;
}

interface SeedProblem {
	title: string;
	slug: string;
	description: string;
	examples: string[];
	constrains: string;
	hints: string[];
	difficulty: "EASY" | "MEDIUM" | "HARD";
	categories: (
		| "ARRAYS"
		| "STRINGS"
		| "HASHMAPS"
		| "TWO_POINTERS"
		| "STACKS"
		| "BINARY_SEARCH"
		| "SLIDING_WINDOW"
		| "LINKED_LISTS"
		| "TREES"
		| "TRIES"
		| "BACKTRACKING"
		| "HEAPS"
		| "GRAPHS"
		| "DYNAMIC_PROGRAMMING"
		| "INTERVALS"
		| "GREEDY"
		| "MATH"
		| "MISC"
	)[];
	solution: string;
	explanation: string;
	isPublished: boolean;
	testCases: SeedTestCase[];
	starterCodes: SeedStarterCode[];
}

// ─── Problem Data ────────────────────────────────────────────────────────────

const problems: SeedProblem[] = [
	// ── 1. Two Sum ────────────────────────────────────────────────────────────
	{
		title: "Two Sum",
		slug: "two-sum",
		description:
			"Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
		examples: [
			"Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0,1].",
			"Input: nums = [3,2,4], target = 6\nOutput: [1,2]",
			"Input: nums = [3,3], target = 6\nOutput: [0,1]",
		],
		constrains:
			"2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.",
		hints: [
			"A brute force approach would check every pair of numbers. Can you do better?",
			"Think about what value you need to find for each number. Can you look it up quickly?",
			"A hash map lets you look up complements in O(1) time.",
		],
		difficulty: "EASY",
		categories: ["ARRAYS", "HASHMAPS"],
		solution:
			"function solution(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n}",
		explanation:
			"Use a hash map to store each number's index as you iterate. For each number, check if its complement (target - current) already exists in the map. This gives O(n) time complexity instead of O(n^2) with brute force.",
		isPublished: true,
		testCases: [
			{ input: "[[2,7,11,15],9]", expectedOutput: "[0,1]", isSample: true },
			{ input: "[[3,2,4],6]", expectedOutput: "[1,2]", isSample: true },
			{ input: "[[3,3],6]", expectedOutput: "[0,1]", isSample: true },
			{ input: "[[1,2,3,4,5],9]", expectedOutput: "[3,4]", isSample: false },
			{ input: "[[-3,4,3,90],0]", expectedOutput: "[0,2]", isSample: false },
			{ input: "[[0,4,3,0],0]", expectedOutput: "[0,3]", isSample: false },
			{ input: "[[1,5,1,5],10]", expectedOutput: "[1,3]", isSample: false },
			{ input: "[[100,200,300,400],700]", expectedOutput: "[2,3]", isSample: false },
			{ input: "[[-1000000,1000000,500000],0]", expectedOutput: "[0,1]", isSample: false },
			{ input: "[[1,2,3,4,5,6,7,8,9,10],19]", expectedOutput: "[8,9]", isSample: false },
			{ input: "[[0,0],0]", expectedOutput: "[0,1]", isSample: false },
			{ input: "[[5,75,25],100]", expectedOutput: "[1,2]", isSample: false },
			{ input: "[[2,5,5,11],10]", expectedOutput: "[1,2]", isSample: false },
			{ input: "[[1000000000,1000000000],2000000000]", expectedOutput: "[0,1]", isSample: false },
		],
		starterCodes: [
			{
				language: "JAVASCRIPT",
				code: "function solution(nums, target) {\n  // your code here\n}",
			},
			{
				language: "PYTHON",
				code: "def solution(nums, target):\n    # your code here\n    pass",
			},
			{
				language: "JAVA",
				code: "public int[] solution(int[] nums, int target) {\n    // your code here\n    return new int[]{};\n}",
			},
			{
				language: "CSHARP",
				code: "public int[] solution(int[] nums, int target) {\n    // your code here\n    return new int[]{};\n}",
			},
			{
				language: "CPP",
				code: "vector<int> solution(vector<int>& nums, int target) {\n    // your code here\n    return {};\n}",
			},
		],
	},

	// ── 2. Contains Duplicate ─────────────────────────────────────────────────
	{
		title: "Contains Duplicate",
		slug: "contains-duplicate",
		description:
			"Given an integer array `nums`, return `true` if any value appears at least twice in the array, and return `false` if every element is distinct.",
		examples: [
			"Input: nums = [1,2,3,1]\nOutput: true\nExplanation: The element 1 occurs at indices 0 and 3.",
			"Input: nums = [1,2,3,4]\nOutput: false\nExplanation: All elements are distinct.",
			"Input: nums = [1,1,1,3,3,4,3,2,4,2]\nOutput: true",
		],
		constrains: "1 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9",
		hints: [
			"The simplest approach is to compare every pair — but that's O(n^2).",
			"What data structure lets you check membership in O(1)?",
		],
		difficulty: "EASY",
		categories: ["ARRAYS", "HASHMAPS"],
		solution:
			"function solution(nums) {\n  const seen = new Set();\n  for (const num of nums) {\n    if (seen.has(num)) return true;\n    seen.add(num);\n  }\n  return false;\n}",
		explanation:
			"Iterate through the array, adding each element to a Set. If the element is already in the Set, we found a duplicate. O(n) time, O(n) space.",
		isPublished: true,
		testCases: [
			{ input: "[[1,2,3,1]]", expectedOutput: "true", isSample: true },
			{ input: "[[1,2,3,4]]", expectedOutput: "false", isSample: true },
			{ input: "[[1,1,1,3,3,4,3,2,4,2]]", expectedOutput: "true", isSample: true },
			{ input: "[[1]]", expectedOutput: "false", isSample: false },
			{ input: "[[1,1]]", expectedOutput: "true", isSample: false },
			{ input: "[[1,2,3,4,5,6,7,8,9,10]]", expectedOutput: "false", isSample: false },
			{ input: "[[1,2,3,4,5,6,7,8,9,1]]", expectedOutput: "true", isSample: false },
			{ input: "[[-1,-1]]", expectedOutput: "true", isSample: false },
			{ input: "[[-1,0,1]]", expectedOutput: "false", isSample: false },
			{ input: "[[0,0,0,0]]", expectedOutput: "true", isSample: false },
			{ input: "[[1000000000,-1000000000,1000000000]]", expectedOutput: "true", isSample: false },
		],
		starterCodes: [
			{
				language: "JAVASCRIPT",
				code: "function solution(nums) {\n  // your code here\n}",
			},
			{
				language: "PYTHON",
				code: "def solution(nums):\n    # your code here\n    pass",
			},
			{
				language: "JAVA",
				code: "public boolean solution(int[] nums) {\n    // your code here\n    return false;\n}",
			},
			{
				language: "CSHARP",
				code: "public bool solution(int[] nums) {\n    // your code here\n    return false;\n}",
			},
			{
				language: "CPP",
				code: "bool solution(vector<int>& nums) {\n    // your code here\n    return false;\n}",
			},
		],
	},

	// ── 3. Valid Anagram ──────────────────────────────────────────────────────
	{
		title: "Valid Anagram",
		slug: "valid-anagram",
		description:
			'Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.\n\nAn anagram is a word or phrase formed by rearranging the letters of a different word or phrase, using all the original letters exactly once.',
		examples: [
			'Input: s = "anagram", t = "nagaram"\nOutput: true',
			'Input: s = "rat", t = "car"\nOutput: false',
		],
		constrains:
			"1 <= s.length, t.length <= 5 * 10^4\ns and t consist of lowercase English letters.",
		hints: [
			"If the two strings have different lengths, they can't be anagrams.",
			"Count the frequency of each character in both strings and compare.",
		],
		difficulty: "EASY",
		categories: ["STRINGS", "HASHMAPS"],
		solution:
			'function solution(s, t) {\n  if (s.length !== t.length) return false;\n  const count = {};\n  for (const c of s) count[c] = (count[c] || 0) + 1;\n  for (const c of t) {\n    if (!count[c]) return false;\n    count[c]--;\n  }\n  return true;\n}',
		explanation:
			"Count character frequencies in the first string, then decrement for each character in the second. If any count goes below zero or the lengths differ, it's not an anagram. O(n) time, O(1) space (fixed 26-letter alphabet).",
		isPublished: true,
		testCases: [
			{ input: '["anagram","nagaram"]', expectedOutput: "true", isSample: true },
			{ input: '["rat","car"]', expectedOutput: "false", isSample: true },
			{ input: '["listen","silent"]', expectedOutput: "true", isSample: true },
			{ input: '["a","a"]', expectedOutput: "true", isSample: false },
			{ input: '["a","b"]', expectedOutput: "false", isSample: false },
			{ input: '["ab","ba"]', expectedOutput: "true", isSample: false },
			{ input: '["ab","a"]', expectedOutput: "false", isSample: false },
			{ input: '["",""]', expectedOutput: "true", isSample: false },
			{ input: '["aabbcc","abcabc"]', expectedOutput: "true", isSample: false },
			{ input: '["aabbcc","aabbcd"]', expectedOutput: "false", isSample: false },
			{ input: '["aacc","ccac"]', expectedOutput: "false", isSample: false },
		],
		starterCodes: [
			{
				language: "JAVASCRIPT",
				code: "function solution(s, t) {\n  // your code here\n}",
			},
			{
				language: "PYTHON",
				code: "def solution(s, t):\n    # your code here\n    pass",
			},
			{
				language: "JAVA",
				code: "public boolean solution(String s, String t) {\n    // your code here\n    return false;\n}",
			},
			{
				language: "CSHARP",
				code: "public bool solution(string s, string t) {\n    // your code here\n    return false;\n}",
			},
			{
				language: "CPP",
				code: "bool solution(string s, string t) {\n    // your code here\n    return false;\n}",
			},
		],
	},

	// ── 4. Best Time to Buy and Sell Stock ────────────────────────────────────
	{
		title: "Best Time to Buy and Sell Stock",
		slug: "best-time-to-buy-and-sell-stock",
		description:
			"You are given an array `prices` where `prices[i]` is the price of a given stock on the `i`th day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return `0`.",
		examples: [
			"Input: prices = [7,1,5,3,6,4]\nOutput: 5\nExplanation: Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6 - 1 = 5.",
			"Input: prices = [7,6,4,3,1]\nOutput: 0\nExplanation: No profitable transaction is possible.",
		],
		constrains: "1 <= prices.length <= 10^5\n0 <= prices[i] <= 10^4",
		hints: [
			"Think about tracking the minimum price seen so far as you iterate.",
			"At each step, the best profit is the current price minus the minimum price seen so far.",
		],
		difficulty: "EASY",
		categories: ["ARRAYS"],
		solution:
			"function solution(prices) {\n  let minPrice = Infinity;\n  let maxProfit = 0;\n  for (const price of prices) {\n    if (price < minPrice) {\n      minPrice = price;\n    } else {\n      maxProfit = Math.max(maxProfit, price - minPrice);\n    }\n  }\n  return maxProfit;\n}",
		explanation:
			"Keep track of the minimum price seen so far and the maximum profit. For each price, either update the minimum or calculate the profit from buying at the minimum and selling now. O(n) time, O(1) space.",
		isPublished: true,
		testCases: [
			{ input: "[[7,1,5,3,6,4]]", expectedOutput: "5", isSample: true },
			{ input: "[[7,6,4,3,1]]", expectedOutput: "0", isSample: true },
			{ input: "[[2,4,1]]", expectedOutput: "2", isSample: true },
			{ input: "[[1]]", expectedOutput: "0", isSample: false },
			{ input: "[[1,2]]", expectedOutput: "1", isSample: false },
			{ input: "[[2,1]]", expectedOutput: "0", isSample: false },
			{ input: "[[3,3,3,3]]", expectedOutput: "0", isSample: false },
			{ input: "[[1,2,3,4,5]]", expectedOutput: "4", isSample: false },
			{ input: "[[5,4,3,2,1,10]]", expectedOutput: "9", isSample: false },
			{ input: "[[1,4,2,7,1,3]]", expectedOutput: "6", isSample: false },
			{ input: "[[10000,1,10000]]", expectedOutput: "9999", isSample: false },
			{ input: "[[1,2,4,2,5,7,2,4,9,0]]", expectedOutput: "8", isSample: false },
		],
		starterCodes: [
			{
				language: "JAVASCRIPT",
				code: "function solution(prices) {\n  // your code here\n}",
			},
			{
				language: "PYTHON",
				code: "def solution(prices):\n    # your code here\n    pass",
			},
			{
				language: "JAVA",
				code: "public int solution(int[] prices) {\n    // your code here\n    return 0;\n}",
			},
			{
				language: "CSHARP",
				code: "public int solution(int[] prices) {\n    // your code here\n    return 0;\n}",
			},
			{
				language: "CPP",
				code: "int solution(vector<int>& prices) {\n    // your code here\n    return 0;\n}",
			},
		],
	},

	// ── 5. Maximum Subarray ───────────────────────────────────────────────────
	{
		title: "Maximum Subarray",
		slug: "maximum-subarray",
		description:
			"Given an integer array `nums`, find the subarray with the largest sum, and return its sum.\n\nA subarray is a contiguous non-empty sequence of elements within an array.",
		examples: [
			"Input: nums = [-2,1,-3,4,-1,2,1,-5,4]\nOutput: 6\nExplanation: The subarray [4,-1,2,1] has the largest sum 6.",
			"Input: nums = [1]\nOutput: 1\nExplanation: The subarray [1] has the largest sum 1.",
			"Input: nums = [5,4,-1,7,8]\nOutput: 23\nExplanation: The subarray [5,4,-1,7,8] has the largest sum 23.",
		],
		constrains:
			"1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4",
		hints: [
			"Think about whether extending the current subarray helps or hurts.",
			"At each position, you either extend the previous subarray or start a new one from the current element.",
			"This is Kadane's algorithm.",
		],
		difficulty: "MEDIUM",
		categories: ["ARRAYS", "DYNAMIC_PROGRAMMING"],
		solution:
			"function solution(nums) {\n  let currentSum = nums[0];\n  let maxSum = nums[0];\n  for (let i = 1; i < nums.length; i++) {\n    currentSum = Math.max(nums[i], currentSum + nums[i]);\n    maxSum = Math.max(maxSum, currentSum);\n  }\n  return maxSum;\n}",
		explanation:
			"Kadane's algorithm: maintain the maximum subarray sum ending at the current position. At each step, either start a new subarray at the current element or extend the previous one. Track the global maximum. O(n) time, O(1) space.",
		isPublished: true,
		testCases: [
			{ input: "[[-2,1,-3,4,-1,2,1,-5,4]]", expectedOutput: "6", isSample: true },
			{ input: "[[1]]", expectedOutput: "1", isSample: true },
			{ input: "[[5,4,-1,7,8]]", expectedOutput: "23", isSample: true },
			{ input: "[[-1]]", expectedOutput: "-1", isSample: false },
			{ input: "[[-2,-1]]", expectedOutput: "-1", isSample: false },
			{ input: "[[1,2,3,4]]", expectedOutput: "10", isSample: false },
			{ input: "[[-1,-2,-3,-4]]", expectedOutput: "-1", isSample: false },
			{ input: "[[1,-1,1,-1,1]]", expectedOutput: "1", isSample: false },
			{ input: "[[-2,1]]", expectedOutput: "1", isSample: false },
			{ input: "[[8,-19,5,-4,20]]", expectedOutput: "21", isSample: false },
			{ input: "[[100,-1,100,-1,100]]", expectedOutput: "298", isSample: false },
			{ input: "[[-1,0,-2]]", expectedOutput: "0", isSample: false },
		],
		starterCodes: [
			{
				language: "JAVASCRIPT",
				code: "function solution(nums) {\n  // your code here\n}",
			},
			{
				language: "PYTHON",
				code: "def solution(nums):\n    # your code here\n    pass",
			},
			{
				language: "JAVA",
				code: "public int solution(int[] nums) {\n    // your code here\n    return 0;\n}",
			},
			{
				language: "CSHARP",
				code: "public int solution(int[] nums) {\n    // your code here\n    return 0;\n}",
			},
			{
				language: "CPP",
				code: "int solution(vector<int>& nums) {\n    // your code here\n    return 0;\n}",
			},
		],
	},
];

// ─── Seed Logic ──────────────────────────────────────────────────────────────

async function main() {
	for (const problem of problems) {
		const { testCases, starterCodes, ...problemData } = problem;

		const result = await prisma.problem.upsert({
			where: { slug: problemData.slug },
			update: {},
			create: {
				...problemData,
				TestCases: { create: testCases },
				StarterCodes: { create: starterCodes },
			},
		});

		console.log(`✔ ${result.title} (${result.slug}) — seeded`);
	}

	console.log(`\nDone — ${problems.length} problems seeded.`);
}

main()
	.catch((e) => {
		console.error("Seed failed:", e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
