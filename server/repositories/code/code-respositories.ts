import {
	Problem,
	TestCase,
	Submission,
	SubmissionStatus,
} from "../../generated/prisma";
import { PrismaServiceInstance } from "../../config/prisma-config";
import { CodeSubmissionResult } from "../../services/code/code-service";
import { HttpError } from "../../types/common/error-types";

// ============================================================================
// Interface Definition
// ============================================================================

interface ICodeRepository {
	getProblem(id: string): Promise<Problem | null>;
	getTestCase(id: string): Promise<TestCase | null>;
	getAllTestCases(id: string): Promise<TestCase[]>;
	updateUserSubmission(
		userId: string,
		problemId: string,
		code: string,
		language: string,
		result: CodeSubmissionResult
	): Promise<Submission>;
}

// ============================================================================
// Repository Implementation
// ============================================================================

export class CodeRepository implements ICodeRepository {
	private get prisma() {
		return PrismaServiceInstance.getClient();
	}

	// ========================================================================
	// Problem Operations
	// ========================================================================

	async getProblem(id: string): Promise<Problem | null> {
		if (!id || typeof id !== 'string' || id.trim() === '') {
			throw new HttpError(400, 'Invalid problem ID provided');
		}

		try {
			return await this.prisma.problem.findUnique({
				where: { id },
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			throw new HttpError(500, 'Failed to retrieve problem from database', { originalError: errorMessage });
		}
	}

	// ========================================================================
	// Test Case Operations
	// ========================================================================

	async getTestCase(id: string): Promise<TestCase | null> {
		if (!id || typeof id !== 'string' || id.trim() === '') {
			throw new HttpError(400, 'Invalid problem ID provided');
		}

		try {
			return await this.prisma.testCase.findFirst({
				where: { problemId: id, isExample: true },
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			throw new HttpError(500, 'Failed to retrieve test case from database', { originalError: errorMessage });
		}
	}

	async getAllTestCases(id: string): Promise<TestCase[]> {
		if (!id || typeof id !== 'string' || id.trim() === '') {
			throw new HttpError(400, 'Invalid problem ID provided');
		}

		try {
			return await this.prisma.testCase.findMany({
				where: { problemId: id },
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			throw new HttpError(500, 'Failed to retrieve test cases from database', { originalError: errorMessage });
		}
	}

	// ========================================================================
	// Submission Operations
	// ========================================================================

	async updateUserSubmission(
		userId: string,
		problemId: string,
		code: string,
		language: string,
		result: CodeSubmissionResult
	): Promise<Submission> {
		if (!userId || typeof userId !== 'string' || userId.trim() === '') {
			throw new HttpError(400, 'Invalid user ID provided');
		}
		if (!problemId || typeof problemId !== 'string' || problemId.trim() === '') {
			throw new HttpError(400, 'Invalid problem ID provided');
		}
		if (!code || typeof code !== 'string' || code.trim() === '') {
			throw new HttpError(400, 'Invalid code provided');
		}
		if (!language || typeof language !== 'string') {
			throw new HttpError(400, 'Invalid language provided');
		}

		const problem = await this.getProblem(problemId);
		if (!problem) {
			throw new HttpError(404, `Problem with ID ${problemId} not found`);
		}

		const submissionData = this.buildSubmissionData(
			userId,
			problemId,
			code,
			language,
			result,
			problem.rewardCredits
		);

		try {
			return await this.upsertSubmission(userId, problemId, submissionData);
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			throw new HttpError(500, 'Failed to update user submission', { originalError: errorMessage });
		}
	}

	// ========================================================================
	// Private Helper Methods
	// ========================================================================

	private buildSubmissionData(
		userId: string,
		problemId: string,
		code: string,
		language: string,
		result: CodeSubmissionResult,
		rewardCredits: number
	) {
		const status = this.determineSubmissionStatus(result);
		const score = this.calculateScore(result);
		const creditsEarned = result.success ? rewardCredits : 0;
		const errorMessage = this.extractErrorMessage(result);

		return {
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
			errorMessage,
			creditsEarned,
		};
	}

	private determineSubmissionStatus(result: CodeSubmissionResult): SubmissionStatus {
		if (result.success) {
			return SubmissionStatus.accepted;
		}

		const hasErrors = result.testResults.some((testResult) => testResult.error);
		return hasErrors ? SubmissionStatus.runtime_error : SubmissionStatus.wrong_answer;
	}

	private calculateScore(result: CodeSubmissionResult): number {
		if (result.totalTests === 0) {
			return 0;
		}
		return Math.floor((result.passedTests / result.totalTests) * 100);
	}

	private extractErrorMessage(result: CodeSubmissionResult): string | null {
		const firstError = result.testResults.find((testResult) => testResult.error);
		return firstError?.error || null;
	}

	private async upsertSubmission(
		userId: string,
		problemId: string,
		submissionData: ReturnType<CodeRepository["buildSubmissionData"]>
	): Promise<Submission> {
		const existingSubmission = await this.findExistingSubmission(userId, problemId);

		if (existingSubmission) {
			return await this.updateIfBetter(existingSubmission, submissionData);
		}

		return await this.createSubmission(submissionData);
	}

	private async findExistingSubmission(
		userId: string,
		problemId: string
	): Promise<Submission | null> {
		return await this.prisma.submission.findFirst({
			where: { userId, problemId },
		});
	}

	private async updateIfBetter(
		existingSubmission: Submission,
		newSubmissionData: ReturnType<CodeRepository["buildSubmissionData"]>
	): Promise<Submission> {
		// Only update if the new submission has a better or equal score
		if (newSubmissionData.score >= existingSubmission.score) {
			return await this.prisma.submission.update({
				where: { id: existingSubmission.id },
				data: newSubmissionData,
			});
		}

		return existingSubmission;
	}

	private async createSubmission(
		submissionData: ReturnType<CodeRepository["buildSubmissionData"]>
	): Promise<Submission> {
		return await this.prisma.submission.create({
			data: submissionData,
		});
	}
}
