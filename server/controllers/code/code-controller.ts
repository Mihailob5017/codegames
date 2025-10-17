import { CodeService } from "../../services/code/code-service";
import {
	ControllerFn,
	ResponseObject,
} from "../../types/common/controller-types";
import { z } from "zod";
import { HttpError } from "../../types/common/error-types";

const testCaseExecutionSchema = z.object({
	problemId: z.string().min(1, "Problem ID is required"),
	userCode: z.string().min(1, "User code is required"),
	language: z.enum(["javascript", "python"], {
		message: 'Language must be either "javascript" or "python"',
	}),
});

export class CodeController {
	static runExampleTestCase: ControllerFn = async (req, res, next) => {
		try {
			console.log("Request body:", req.body);
			const validatedData = testCaseExecutionSchema.parse(req.body);
			console.log("Validated data:", validatedData);

			const codeService = new CodeService();
			console.log("About to call runSingleTestCase...");
			
			const result = await codeService.runSingleTestCase({
				problemId: validatedData.problemId,
				userCode: validatedData.userCode,
				language: validatedData.language,
			});
			
			console.log("Result:", result);

			const responseObj = ResponseObject.success(
				200,
				"Example test case executed successfully",
				result
			);
			responseObj.send(res);
		} catch (error) {
			console.error("Controller error:", error);
			if (error instanceof z.ZodError) {
				next(new HttpError(400, "Validation error", error.issues));
				return;
			}
			next(error);
		}
	};
}
