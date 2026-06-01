// codegames-api/auth/auth.controller.ts
import { z } from "zod";
import { ControllerType } from "../shared/types/common.types";
import { ValidationError } from "../shared/errors/app-error";
import { RegisterSchema } from "./auth.dto";
import AuthService from "./auth.service";

class AuthController {
	private static readonly service = new AuthService();

	static readonly register: ControllerType<void> = async (req, res) => {
		const parsed = RegisterSchema.safeParse(req.body);
		if (!parsed.success) {
			throw new ValidationError(
				"Invalid input",
				z.flattenError(parsed.error).fieldErrors,
			);
		}
		await AuthController.service.register(parsed.data, req.file);
		res.status(201).json({
			status: "success",
			message: "User registered successfully",
		});
	};
}

export default AuthController;
