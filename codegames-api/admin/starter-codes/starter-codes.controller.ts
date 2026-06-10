import { z } from "zod";
import { ControllerType } from "../../shared/types/common.types";
import { ValidationError } from "../../shared/errors/app-error";
import StarterCodesService from "./starter-codes.service";
import {
	BulkAddStarterCodesSchema,
	StarterCodeSchema,
} from "./starter-codes.dto";

class StarterCodesController {
	private static readonly service = new StarterCodesService();

	static readonly getStarterCodesByProblemId: ControllerType<void> = async (
		req,
		res,
	) => {
		const starterCodes =
			await StarterCodesController.service.getStarterCodesByProblemId(
				req.params.id as string,
			);
		res.status(200).json({ status: "success", data: starterCodes });
	};

	static readonly addStarterCodeToProblem: ControllerType<void> = async (
		req,
		res,
	) => {
		const parsed = StarterCodeSchema.safeParse(req.body);
		if (!parsed.success) {
			throw new ValidationError(
				"Invalid starter code data",
				z.flattenError(parsed.error).fieldErrors,
			);
		}
		const starterCode =
			await StarterCodesController.service.addStarterCodeToProblem(
				req.params.id as string,
				parsed.data,
			);
		res.status(201).json({ status: "success", data: starterCode });
	};

	static readonly bulkAddStarterCodesToProblem: ControllerType<void> = async (
		req,
		res,
	) => {
		const parsed = BulkAddStarterCodesSchema.safeParse(req.body);
		if (!parsed.success) {
			// Root schema is an array, so fieldErrors is keyed by index —
			// convert to the Record shape ValidationError expects.
			throw new ValidationError(
				"Invalid starter codes data",
				Object.fromEntries(
					Object.entries(z.flattenError(parsed.error).fieldErrors),
				),
			);
		}
		const result =
			await StarterCodesController.service.bulkAddStarterCodesToProblem(
				req.params.id as string,
				parsed.data,
			);
		res.status(201).json({ status: "success", data: result });
	};
}

export default StarterCodesController;
