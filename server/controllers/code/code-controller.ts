import { Response as ExpressResponse, NextFunction } from "express";
import { CodeService } from "../../services/code/code-service";
import {
	ControllerFn,
	ResponseObject,
} from "../../types/common/controller-types";
import { z } from "zod";
import { HttpError } from "../../types/common/error-types";
import { AuthRequest } from "../../middlewares/auth-middleware";

const testCaseExecutionSchema = z.object({
	problemId: z.string().min(1, "Problem ID is required"),
	userCode: z.string().min(1, "User code is required"),
	language: z.enum(["javascript", "python", "java", "cpp"], {
		message: 'Language must be one of: "javascript", "python", "java", "cpp"',
	}),
});

type TestCaseExecutionRequest = z.infer<typeof testCaseExecutionSchema>;

export class CodeController {
	private static codeService = new CodeService();

	static runTestCase: ControllerFn = async (req, res, next) => {
		try {
			const validatedData = CodeController.validateRequest(req.body);
			const result = await CodeController.codeService.runSingleTestCase(
				validatedData
			);

			CodeController.sendSuccessResponse(
				res,
				200,
				"Test case executed successfully",
				result
			);
		} catch (error) {
			CodeController.handleError(error, next);
		}
	};

	static runAllTestCases: ControllerFn = async (req, res, next) => {
		try {
			const validatedData = CodeController.validateRequest(req.body);
			const result = await CodeController.codeService.runAllTestCases(
				validatedData
			);

			CodeController.sendSuccessResponse(
				res,
				200,
				"All test cases executed successfully",
				result
			);
		} catch (error) {
			CodeController.handleError(error, next);
		}
	};

	static submitSolution: ControllerFn = async (req: AuthRequest, res, next) => {
		try {
			const validatedData = CodeController.validateRequest(req.body);
			const userId = CodeController.extractUserId(req);

			const result = await CodeController.codeService.submitCodeSolution({
				...validatedData,
				userId,
			});

			CodeController.sendSuccessResponse(
				res,
				200,
				"Solution submitted successfully",
				result
			);
		} catch (error) {
			CodeController.handleError(error, next);
		}
	};

	private static validateRequest(body: unknown): TestCaseExecutionRequest {
		return testCaseExecutionSchema.parse(body);
	}

	private static extractUserId(req: AuthRequest): string {
		if (!req.userId) {
			throw new HttpError(401, "User not authenticated");
		}

		return req.userId;
	}

	private static sendSuccessResponse(
		res: ExpressResponse,
		status: 200 | 201,
		message: string,
		data: unknown
	): void {
		const responseObj = ResponseObject.success(status, message, data);
		responseObj.send(res);
	}

	private static handleError(error: unknown, next: NextFunction): void {
		if (error instanceof z.ZodError) {
			next(new HttpError(400, "Validation error", error.issues));
			return;
		}
		next(error);
	}
}
