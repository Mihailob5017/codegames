import { z } from "zod";
import { ControllerType } from "../../shared/types/common.types";
import { ValidationError } from "../../shared/errors/app-error";
import TestCasesService from "./test-cases.service";
import { BulkAddTestCasesSchema, TestCaseSchema } from "./test-cases.dto";

class TestCasesController {
	private static readonly service = new TestCasesService();

	static readonly getTestCasesByProblemId: ControllerType<void> = async (
		req,
		res,
	) => {
		const testCases =
			await TestCasesController.service.getTestCasesByProblemId(
				req.params.id as string,
			);
		res.status(200).json({ status: "success", data: testCases });
	};

	static readonly addTestCaseToProblem: ControllerType<void> = async (
		req,
		res,
	) => {
		const parsed = TestCaseSchema.safeParse(req.body);
		if (!parsed.success) {
			throw new ValidationError(
				"Invalid test case data",
				z.flattenError(parsed.error).fieldErrors,
			);
		}
		const testCase = await TestCasesController.service.addTestCaseToProblem(
			req.params.id as string,
			parsed.data,
		);
		res.status(201).json({ status: "success", data: testCase });
	};

	static readonly bulkAddTestCasesToProblem: ControllerType<void> = async (
		req,
		res,
	) => {
		const parsed = BulkAddTestCasesSchema.safeParse(req.body);
		if (!parsed.success) {
			// Root schema is an array, so fieldErrors is keyed by index —
			// convert to the Record shape ValidationError expects.
			throw new ValidationError(
				"Invalid test cases data",
				Object.fromEntries(
					Object.entries(z.flattenError(parsed.error).fieldErrors),
				),
			);
		}
		const result =
			await TestCasesController.service.bulkAddTestCasesToProblem(
				req.params.id as string,
				parsed.data,
			);
		res.status(201).json({ status: "success", data: result });
	};
}

export default TestCasesController;
