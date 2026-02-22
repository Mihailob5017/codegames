import { ControllerType } from "../types/common.types";
import { validateInput } from "../util/helper";
import { CodeExecutionSchema } from "../util/validation-schema";
import CodeService from "./code.service";

class CodeController {
	private static readonly codeService: CodeService = new CodeService(
		process.env.PISTON_URL!,
	);
	static readonly healthCheck: ControllerType<void> = async (req, res) => {
		console.log("API: v1/code/health-check");
		res.json({ status: "ok", message: "Hello from CodeController" });
	};
	static readonly executeCode: ControllerType<void> = async (req, res) => {};
	static readonly runCode: ControllerType<void> = async (req, res) => {
		try {
			const inputValid = validateInput(CodeExecutionSchema, req.body);
			if (!inputValid) {
				res.status(400).json({ status: "error", message: "Invalid input" });
				return;
			}
			const result = await CodeController.codeService.run(req.body);
			res.status(200).json({ status: "success", data: result });
		} catch (error) {
			res
				.status(500)
				.json({ status: "error", message: "Internal server error" });
		}
	};
}

export default CodeController;
