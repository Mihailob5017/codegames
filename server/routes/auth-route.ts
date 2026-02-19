import { Router } from "express";
import { AuthController } from "../controllers/auth/auth-controller";
import { AuthMiddleware } from "../middlewares/auth-middleware";
import { RateLimit } from "../middlewares/rate-limit-middleware";

const router = Router();

router.post("/signup", AuthController.signup);
router.post("/login", AuthController.login);

router.post("/verify-otp", AuthMiddleware, AuthController.verifyOTP);
router.post(
	"/resend-otp",
	AuthMiddleware,
	RateLimit(5 * 60),
	AuthController.resendOTP,
);

router.post("/refresh-token", AuthController.refreshToken);

export default router;
