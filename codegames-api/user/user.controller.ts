import { ValidationError } from "../errors/app-error";
import { ControllerType } from "../types/common.types";
import { z } from "zod";
import { CreateUserSchema } from "./user.dto";
class UserController {
	static readonly Register: ControllerType<void> = async (req, res) => {
		const userInput = CreateUserSchema.safeParse(req.body);

		if (!userInput.success) {
			throw new ValidationError(
				"Invalid input",
				z.flattenError(userInput.error).fieldErrors,
			);
		}

		// A service goes here which is supposed to do the following:
		// 1. Hash the user's password using bcrypt before storing it
		// 2. Upload the profile image to S3 and store the returned URL
		// 3. Create the user record in the database
		// 4. Send a verification email containing a 6-digit OTP code
		// 5. Issue a signed JWT (and refresh token) upon successful registration
	};
}

export default UserController;
