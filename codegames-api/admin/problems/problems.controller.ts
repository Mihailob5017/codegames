import { z } from "zod";
import {
	ControllerType,
	PaginationSchema,
} from "../../shared/types/common.types";
import { NotFoundError, ValidationError } from "../../shared/errors/app-error";
import ProblemsService from "./problems.service";
import {
	CreateProblemSchema,
	ProblemQuerySchema,
	UpdateProblemSchema,
} from "./problems.dto";

class ProblemsController {
	private static readonly service = new ProblemsService();

	static readonly getProblems: ControllerType<void> = async (req, res) => {
		const pagination = ProblemsController.parsePagination(req.query);
		const result =
			await ProblemsController.service.getAllProblems(pagination);
		res.status(200).json({ status: "success", ...result });
	};

	static readonly queryProblems: ControllerType<void> = async (req, res) => {
		const parsed = ProblemQuerySchema.safeParse(req.query);
		if (!parsed.success) {
			throw new ValidationError(
				"Invalid query parameters",
				z.flattenError(parsed.error).fieldErrors,
			);
		}
		const pagination = ProblemsController.parsePagination(req.query);
		const result = await ProblemsController.service.queryProblems(
			parsed.data,
			pagination,
		);
		res.status(200).json({ status: "success", ...result });
	};

	private static parsePagination(query: unknown) {
		const parsed = PaginationSchema.safeParse(query);
		if (!parsed.success) {
			throw new ValidationError(
				"Invalid pagination parameters",
				z.flattenError(parsed.error).fieldErrors,
			);
		}
		return parsed.data;
	}

	static readonly getProblemById: ControllerType<void> = async (req, res) => {
		const problem = await ProblemsController.service.getProblemById(
			req.params.id as string,
		);
		if (!problem) {
			throw new NotFoundError("Problem not found");
		}
		res.status(200).json({ status: "success", data: problem });
	};

	static readonly createProblem: ControllerType<void> = async (req, res) => {
		const parsed = CreateProblemSchema.safeParse(req.body);
		if (!parsed.success) {
			throw new ValidationError(
				"Invalid problem data",
				z.flattenError(parsed.error).fieldErrors,
			);
		}
		const problem = await ProblemsController.service.createProblem(
			parsed.data,
		);
		res.status(201).json({ status: "success", data: problem });
	};

	static readonly updateProblem: ControllerType<void> = async (req, res) => {
		const parsed = UpdateProblemSchema.safeParse(req.body);
		if (!parsed.success) {
			throw new ValidationError(
				"Invalid problem data",
				z.flattenError(parsed.error).fieldErrors,
			);
		}
		const problem = await ProblemsController.service.updateProblem(
			req.params.id as string,
			parsed.data,
		);
		res.status(200).json({ status: "success", data: problem });
	};

	static readonly deleteProblem: ControllerType<void> = async (req, res) => {
		await ProblemsController.service.deleteProblem(req.params.id as string);
		res.status(200).json({ status: "success", message: "Problem deleted" });
	};
}

export default ProblemsController;
