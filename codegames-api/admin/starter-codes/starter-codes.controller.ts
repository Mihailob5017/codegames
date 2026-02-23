import { ControllerType } from "../../types/common.types";
import { ValidationError } from "../../errors/app-error";
import StarterCodesService from "./starter-codes.service";
import { BulkAddStarterCodesSchema } from "../../util/validation-schema";

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
		const starterCode =
			await StarterCodesController.service.addStarterCodeToProblem(
				req.params.id as string,
				req.body,
			);
		res.status(201).json({ status: "success", data: starterCode });
	};

	static readonly bulkAddStarterCodesToProblem: ControllerType<void> = async (
		req,
		res,
	) => {
		const parsed = BulkAddStarterCodesSchema.safeParse(req.body);
		if (!parsed.success) {
			throw new ValidationError("Invalid starter codes data");
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
