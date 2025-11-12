import { CodeService } from "../../services/code/code-service";
import {
	ControllerFn,
	ResponseObject,
} from "../../types/common/controller-types";
import { z } from "zod";
import { HttpError } from "../../types/common/error-types";
import {
	AuthRequest,
	extractTokenFromRequest,
} from "../../middlewares/auth-middleware";
import { verifyJWT } from "../../utils/auth";

const testCaseExecutionSchema = z.object({
	problemId: z.string().min(1, "Problem ID is required"),
	userCode: z.string().min(1, "User code is required"),
	language: z.enum(["javascript", "python"], {
		message: 'Language must be either "javascript" or "python"',
	}),
});

export class CodeController {
	static runTestCase: ControllerFn = async (req, res, next) => {
		try {
			const validatedData = testCaseExecutionSchema.parse(req.body);

			const codeService = new CodeService();
			const result = await codeService.runSingleTestCase({
				problemId: validatedData.problemId,
				userCode: validatedData.userCode,
				language: validatedData.language,
			});

			const responseObj = ResponseObject.success(
				200,
				"Test case executed successfully",
				result
			);
			responseObj.send(res);
		} catch (error) {
			if (error instanceof z.ZodError) {
				next(new HttpError(400, "Validation error", error.issues));
				return;
			}
			next(error);
		}
	};

	static runAllTestCases: ControllerFn = async (req, res, next) => {
		try {
			const validatedData = testCaseExecutionSchema.parse(req.body);
			const codeService = new CodeService();
			const result = await codeService.runAllTestCases({
				problemId: validatedData.problemId,
				userCode: validatedData.userCode,
				language: validatedData.language,
			});
			const responseObj = ResponseObject.success(
				200,
				"All test cases executed successfully",
				result
			);
			responseObj.send(res);
		} catch (error) {
			if (error instanceof z.ZodError) {
				next(new HttpError(400, "Validation error", error.issues));
				return;
			}
			next(error);
		}
	};
	static submitSolution: ControllerFn = async (req: AuthRequest, res, next) => {
		try {
			const validatedData = testCaseExecutionSchema.parse(req.body);
			const token = extractTokenFromRequest(req);

			if (!token) {
				return next(new HttpError(401, "Authentication token required"));
			}

			const decoded = verifyJWT(token);
			req.userId = decoded.id;
			const codeService = new CodeService();
			const result = await codeService.submitCodeSolution({
				problemId: validatedData.problemId,
				userCode: validatedData.userCode,
				language: validatedData.language,
				userId: req.userId,
			});
			const responseObj = ResponseObject.success(
				200,
				"Solution submitted successfully",
				result
			);
			responseObj.send(res);
		} catch (error) {
			if (error instanceof z.ZodError) {
				next(new HttpError(400, "Validation error", error.issues));
				return;
			}
			next(error);
		}
	};
}
