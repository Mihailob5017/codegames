import { z } from "zod";
import { ControllerType } from "../types/common.types";
import AdminService from "./admin.service";
import { ProblemQuerySchema } from "../util/validation-schema";

class AdminController {
	private static readonly adminService = new AdminService();

	static readonly healthCheck: ControllerType<void> = async (_req, res) => {
		res.status(200).send("Hello from CodeGames API!");
	};

	static readonly getProblems: ControllerType<void> = async (_req, res) => {
		const problems = await AdminController.adminService.getAllProblems();
		res.status(200).json({ status: "success", data: problems });
	};

	static readonly queryProblems: ControllerType<void> = async (req, res) => {
		const parsed = ProblemQuerySchema.safeParse(req.query);
		if (!parsed.success) {
			res.status(400).json({
				status: "error",
				message: z.flattenError(parsed.error).fieldErrors,
			});
			return;
		}
		const problems = await AdminController.adminService.queryProblems(
			parsed.data,
		);
		res.status(200).json({ status: "success", data: problems });
	};

	static readonly getProblemById: ControllerType<void> = async (req, res) => {
		const problem = await AdminController.adminService.getProblemById(
			req.params.id as string,
		);
		if (!problem) {
			res.status(404).json({ status: "error", message: "Problem not found" });
			return;
		}
		res.status(200).json({ status: "success", data: problem });
	};

	static readonly createProblem: ControllerType<void> = async (req, res) => {
		const problem = await AdminController.adminService.createProblem(req.body);
		res.status(201).json({ status: "success", data: problem });
	};

	static readonly updateProblem: ControllerType<void> = async (req, res) => {
		const problem = await AdminController.adminService.updateProblem(
			req.params.id as string,
			req.body,
		);
		res.status(200).json({ status: "success", data: problem });
	};

	static readonly deleteProblem: ControllerType<void> = async (req, res) => {
		await AdminController.adminService.deleteProblem(req.params.id as string);
		res.status(200).json({ status: "success", message: "Problem deleted" });
	};

	// SECTION: Test Cases

	static readonly getTestCasesByProblemId: ControllerType<void> = async (
		req,
		res,
	) => {
		const testCases =
			await AdminController.adminService.getTestCasesByProblemId(
				req.params.id as string,
			);
		res.status(200).json({ status: "success", data: testCases });
	};

	static readonly addTestCaseToProblem: ControllerType<void> = async (
		req,
		res,
	) => {
		const testCase = await AdminController.adminService.addTestCaseToProblem(
			req.params.id as string,
			req.body,
		);
		res.status(201).json({ status: "success", data: testCase });
	};
}

export default AdminController;
