import { Router } from 'express';
import { AdminController } from '../controllers/admin/admin-controller';

const router = Router();

router.get('/whoami', AdminController.whoami);
router.get('/all-users', AdminController.getAllUsers);
router.get('/user/:id', AdminController.getUser);

export default router;
