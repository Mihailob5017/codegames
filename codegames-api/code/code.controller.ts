import { z } from "zod";
import { ControllerType } from "../types/common.types";
import { CodeExecutionSchema } from "../util/validation-schema";
import { ValidationError } from "../errors/app-error";
import CodeService from "./code.service";
import logger from "../infrastructure/logger";

class CodeController {
	private static readonly codeService: CodeService = new CodeService(
		process.env.PISTON_URL!,
	);

	static readonly healthCheck: ControllerType<void> = async (_req, res) => {
		logger.debug("API: v1/code/health-check");
		res.json({ status: "ok", message: "Hello from CodeController" });
	};

	static readonly executeCode: ControllerType<void> = async (req, res) => {
		const parsed = CodeExecutionSchema.safeParse(req.body);
		if (!parsed.success) {
			throw new ValidationError(
				"Invalid input",
				z.flattenError(parsed.error).fieldErrors,
			);
		}
		const result = await CodeController.codeService.execute(parsed.data);
		res.status(200).json({ status: "success", data: result });
	};

	static readonly runCode: ControllerType<void> = async (req, res) => {
		const parsed = CodeExecutionSchema.safeParse(req.body);
		if (!parsed.success) {
			throw new ValidationError(
				"Invalid input",
				z.flattenError(parsed.error).fieldErrors,
			);
		}
		const result = await CodeController.codeService.run(parsed.data);
		res.status(200).json({ status: "success", data: result });
	};

	static readonly getSupportedLanguages: ControllerType<void> = async (
		_req,
		res,
	) => {
		const languages = CodeController.codeService.getSupportedLanguages();
		res.status(200).json({ status: "success", data: languages });
	};

	static readonly getStarterCode: ControllerType<void> = async (req, res) => {
		const { problemId } = req.params;
		const starterCode = await CodeController.codeService.getStarterCode(
			problemId as string,
		);
		res.status(200).json({ status: "success", data: starterCode });
	};
}

export default CodeController;
