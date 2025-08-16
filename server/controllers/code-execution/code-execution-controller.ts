import { CodeExecutionService } from '../../services/code-execution/code-execution-service';
import {
	ControllerFn,
	ResponseObject,
} from '../../types/common/controller-types';
import { z } from 'zod';
import { HttpError } from '../../types/common/error-types';
import { CodeSubmission } from '../../types/dto/code-execution-types';

const codeSubmissionSchema = z.object({
	source_code: z.string().min(1, 'Source code is required'),
	language: z.enum(['javascript', 'python'], {
		message: 'Language must be either "javascript" or "python"'
	}),
	stdin: z.string().optional(),
});

export class CodeExecutionController {
	static executeCode: ControllerFn = async (req, res, next) => {
		try {
			const validatedData = codeSubmissionSchema.parse(req.body);

			const submission: CodeSubmission = {
				source_code: validatedData.source_code,
				language: validatedData.language,
				stdin: validatedData.stdin,
			};

			const codeExecutionService = new CodeExecutionService();
			const result = await codeExecutionService.executeCode(submission);

			const responseObj = ResponseObject.success(
				200,
				'Code executed successfully',
				result
			);
			responseObj.send(res);
		} catch (error) {
			if (error instanceof z.ZodError) {
				next(new HttpError(400, 'Validation error', error.issues));
				return;
			}
			next(error);
		}
	};

	static getSupportedLanguages: ControllerFn = async (_req, res, next) => {
		try {
			const codeExecutionService = new CodeExecutionService();
			const languages = await codeExecutionService.getLanguages();

			const responseObj = ResponseObject.success(
				200,
				'Supported languages retrieved successfully',
				languages
			);
			responseObj.send(res);
		} catch (error) {
			next(error);
		}
	};
}
