import { Router } from 'express';
import { AdminController } from '../controllers/admin/admin-controller';

const router = Router();

router.get('/whoami', AdminController.whoami);
router.get('/users', AdminController.getAllUsers);
router.get('/users/:id', AdminController.getUser);
router.delete('/users/:id', AdminController.deleteUser);

export default router;
