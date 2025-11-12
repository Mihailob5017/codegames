import { Router } from "express";
import { CodeController } from "../controllers/code/code-controller";
import { AuthMiddleware } from "../middlewares/auth-middleware";
import { VerifiedMiddleware } from "../middlewares/verified-middleware";

const router = Router();

router.post(
	"/run-testcase",
	AuthMiddleware,
	VerifiedMiddleware,
	CodeController.runTestCase
);

router.post(
	"/run-all-testcases",
	AuthMiddleware,
	VerifiedMiddleware,
	CodeController.runAllTestCases
);

router.post(
	"/submit-solution",
	AuthMiddleware,
	VerifiedMiddleware,
	CodeController.submitSolution
);

export default router;
