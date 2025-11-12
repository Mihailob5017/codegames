import {
	Problem,
	TestCase,
	Submission,
	SubmissionStatus,
} from "../../generated/prisma";
import { PrismaServiceInstance } from "../../config/prisma-config";
import { CodeSubmissionResult } from "../../services/code/code-service";

interface ICodeRepository {
	getProblem(id: string): Promise<Problem | null>;
	getTestCase(id: string): Promise<TestCase | null>;
	getAllTestCases(id: string): Promise<TestCase[] | null>;
	updateUserSubmission(
		userId: string,
		problemId: string,
		code: string,
		language: string,
		result: CodeSubmissionResult
	): Promise<Submission>;
}

export class CodeRepository implements ICodeRepository {
	public async updateUserSubmission(
		userId: string,
		problemId: string,
		code: string,
		language: string,
		result: CodeSubmissionResult
	): Promise<Submission> {
		try {
			// Get problem to determine reward credits
			const problem = await this.getProblem(problemId);
			if (!problem) {
				throw new Error(`Problem with ID ${problemId} not found`);
			}

			// Determine submission status
			let status: SubmissionStatus = SubmissionStatus.pending;
			if (result.success) {
				status = SubmissionStatus.accepted;
			} else if (result.testResults.some((t) => t.error)) {
				status = SubmissionStatus.runtime_error;
			} else {
				status = SubmissionStatus.wrong_answer;
			}

			// Calculate credits earned (only if all tests pass)
			const creditsEarned = result.success ? problem.rewardCredits : 0;

			// Calculate score based on passed tests
			const score = Math.floor((result.passedTests / result.totalTests) * 100);

			const submissionData = {
				userId,
				problemId,
				code,
				language,
				status,
				executionTime: result.overallExecutionTime,
				memoryUsed: 0, // TODO: Implement memory tracking
				score,
				testCasesPassed: result.passedTests,
				totalTestCases: result.totalTests,
				errorMessage: result.testResults.find((t) => t.error)?.error || null,
				creditsEarned,
			};

			const submissionExists =
				await PrismaServiceInstance.getClient().submission.findFirst({
					where: {
						userId,
						problemId,
					},
				});

			if (submissionExists) {
				// Only update if the new submission is better or equal
				if (submissionData.score >= submissionExists.score) {
					return await PrismaServiceInstance.getClient().submission.update({
						where: {
							id: submissionExists.id,
						},
						data: submissionData,
					});
				}
				return submissionExists;
			} else {
				return await PrismaServiceInstance.getClient().submission.create({
					data: submissionData,
				});
			}
		} catch (error) {
			throw new Error(`Failed to update user submission: ${error}`);
		}
	}
	async getProblem(id: string): Promise<Problem | null> {
		try {
			const problem =
				await PrismaServiceInstance.getClient().problem.findUnique({
					where: { id },
				});
			return problem;
		} catch (error) {
			throw new Error(`Failed to get problem: ${error}`);
		}
	}

	async getTestCase(id: string): Promise<TestCase | null> {
		try {
			const testCase =
				await PrismaServiceInstance.getClient().testCase.findFirst({
					where: { problemId: id, isExample: true },
				});
			return testCase;
		} catch (error) {
			throw new Error(`Failed to get testcase: ${error}`);
		}
	}
	async getAllTestCases(id: string): Promise<TestCase[] | null> {
		try {
			const testcases =
				await PrismaServiceInstance.getClient().testCase.findMany({
					where: { problemId: id },
				});
			return testcases;
		} catch (error) {
			throw new Error(`Failed to get testcase: ${error}`);
		}
	}
}
