import { Router } from 'express';
import { LoginController } from '../controllers/login/login-controller';

const router = Router();

router.post('/create-user', LoginController.signup);

// google signup/login

// verify otp

// resend otp

// forgot password

// login user

// logout user

// refresh token

// get user with token

export default router;
