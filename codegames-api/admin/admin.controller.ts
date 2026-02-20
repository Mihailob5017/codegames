import { ControllerType } from "../types/common.types";

class AdminController {
	public static readonly healthCheck: ControllerType<void> = async (
		_req,
		res,
		_next,
	) => {
		console.log("API: v1/[secret]/health-check");

		res.status(200).send("Hello from CodeGames API!");
	};
}

export default AdminController;
