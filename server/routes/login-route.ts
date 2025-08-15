import { Router } from 'express';
import { LoginController } from '../controllers/auth/login-controller';
import { AuthMiddleware } from '../middlewares/auth-middleware';

const router = Router();

router.post('/signup', LoginController.signup);
router.post('/verify-otp', AuthMiddleware, LoginController.verifyOTP);

// TODO: Implement the following endpoints:
// router.post('/google-auth', LoginController.googleAuth);
// router.post('/resend-otp', AuthMiddleware, LoginController.resendOTP);
// router.post('/forgot-password', LoginController.forgotPassword);
// router.post('/login', LoginController.login);
// router.post('/logout', AuthMiddleware, LoginController.logout);
// router.post('/refresh-token', LoginController.refreshToken);
// router.get('/profile', AuthMiddleware, LoginController.getProfile);

export default router;
