import { Router } from 'express';
import { LoginController } from '../controllers/auth/login-controller';
import { AuthMiddleware } from '../middlewares/auth-middleware';

const router = Router();

router.post('/create-user', LoginController.signup);

// google signup/login

// verify otp
router.post('/verify-otp', AuthMiddleware, LoginController.verifyOTP);
// resend otp

// forgot password

// login user

// logout user

// refresh token

// get user with token

export default router;
