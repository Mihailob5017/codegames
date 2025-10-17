import { Router } from "express";
import { CodeController } from "../controllers/code/code-controller";
import { AuthMiddleware } from "../middlewares/auth-middleware";
import { VerifiedMiddleware } from "../middlewares/verified-middleware";

const router = Router();

router.post(
	"/run-example-testcase",
	AuthMiddleware,
	VerifiedMiddleware,
	CodeController.runExampleTestCase
);

export default router;
