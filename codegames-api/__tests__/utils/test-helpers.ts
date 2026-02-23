import { NextFunction, Request, Response } from "express";

export const createMockRequest = (overrides: Partial<Request> = {}) =>
	({
		body: {},
		params: {},
		query: {},
		headers: {},
		...overrides,
	}) as Partial<Request>;

export const createMockResponse = () => {
	const res = {} as Response;
	(res as unknown as Record<string, jest.Mock>).status = jest
		.fn()
		.mockReturnValue(res);
	(res as unknown as Record<string, jest.Mock>).json = jest
		.fn()
		.mockReturnValue(res);
	(res as unknown as Record<string, jest.Mock>).send = jest
		.fn()
		.mockReturnValue(res);
	return res;
};

export const createMockNext = (): NextFunction => jest.fn();

// Shared mock data factories
export const mockProblemSummary = {
	id: "problem-id-1",
	number: 1,
	title: "Two Sum",
	slug: "two-sum",
	difficulty: "EASY" as const,
	categories: ["ARRAYS"] as const,
	isPublished: true,
	totalSubmissions: 0,
	acceptedSubmissions: 0,
	acceptanceRate: 0,
	createdAt: new Date("2024-01-01"),
};

export const mockProblemFull = {
	...mockProblemSummary,
	description: "Given an array of integers nums and an integer target...",
	examples: ["Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]"],
	constrains: "2 <= nums.length <= 10^4",
	hints: ["Use a hash map to store complements"],
	solution: "function twoSum(nums, target) { const map = {}; }",
	explanation: "We use a hash map to find the complement in O(n).",
	updatedAt: new Date("2024-01-01"),
	TestCases: [],
	StarterCodes: [],
};

export const mockTestCase = {
	id: "tc-id-1",
	problemId: "problem-id-1",
	input: "[2,7,11,15]\n9",
	expectedOutput: "[0,1]",
	isSample: true,
};

export const mockStarterCode = {
	id: "sc-id-1",
	problemId: "problem-id-1",
	language: "JAVASCRIPT" as const,
	code: "function twoSum(nums, target) {\n  // your code here\n}",
};
