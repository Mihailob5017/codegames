import { ValidationError } from "../errors/app-error";
import { ControllerType } from "../types/common.types";
import { z } from "zod";
import { CreateUserSchema } from "./user.dto";
import { UserService } from "./user.service";
class UserController {
	static readonly Register: ControllerType<void> = async (req, res) => {
		const userInput = CreateUserSchema.safeParse(req.body);

		if (!userInput.success) {
			throw new ValidationError(
				"Invalid input",
				z.flattenError(userInput.error).fieldErrors,
			);
		}

		await UserService.Register(userInput.data, req.file);
		res
			.status(201)
			.json({ status: "success", message: "User registered successfully" });
	};
}

export default UserController;
