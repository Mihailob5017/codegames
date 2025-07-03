import { Router } from 'express';
import { AdminController } from '../controllers/adminController';

const router = Router();

router.get('/whoami', AdminController.whoami);

router.get('/all-users', AdminController.getAllUsers);

export default router;
