import { z } from "zod";
import { ControllerType } from "../shared/types/common.types";
import { CodeExecutionSchema } from "./code.dto";
import { ValidationError } from "../shared/errors/app-error";
import CodeService from "./code.service";
import logger from "../infrastructure/logger";
import { getAppConfig } from "../infrastructure/app-config";

class CodeController {
	private static codeService: CodeService | null = null;

	private static getCodeService(): CodeService {
		if (!CodeController.codeService) {
			const pistonUrl = (() => {
				try {
					return getAppConfig().PISTON_URL;
				} catch {
					return process.env.PISTON_URL ?? "http://localhost:2000";
				}
			})();
			CodeController.codeService = new CodeService(pistonUrl);
		}
		return CodeController.codeService;
	}

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
		const result = await CodeController.getCodeService().execute(
			parsed.data,
		);
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
		const result = await CodeController.getCodeService().run(parsed.data);
		res.status(200).json({ status: "success", data: result });
	};

	static readonly getSupportedLanguages: ControllerType<void> = async (
		_req,
		res,
	) => {
		const languages =
			CodeController.getCodeService().getSupportedLanguages();
		res.status(200).json({ status: "success", data: languages });
	};

	static readonly getStarterCode: ControllerType<void> = async (req, res) => {
		const { problemId } = req.params;
		const starterCode =
			await CodeController.getCodeService().getStarterCode(
				problemId as string,
			);
		res.status(200).json({ status: "success", data: starterCode });
	};
}

export default CodeController;
