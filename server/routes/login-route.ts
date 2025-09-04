import { Router } from 'express';
import { LoginController } from '../controllers/auth/login-controller';
import { AuthMiddleware } from '../middlewares/auth-middleware';
import { RateLimit } from '../middlewares/rate-limit-middleware';

const router = Router();

router.post('/signup', LoginController.signup);
router.post('/login', LoginController.login);
router.post('/verify-otp', AuthMiddleware, LoginController.verifyOTP);






router.post(
	'/resend-otp',
	AuthMiddleware,
	RateLimit(5 * 60),
	LoginController.resendOTP
);

// TODO: Implement the following endpoints:
// router.post('/google-auth', LoginController.googleAuth);
// router.post('/forgot-password', LoginController.forgotPassword);
// router.post('/logout', AuthMiddleware, LoginController.logout);
// router.post('/refresh-token', LoginController.refreshToken);
// router.get('/profile', AuthMiddleware, LoginController.getProfile);

export default router;
