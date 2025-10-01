import { Router } from 'express';
import { AdminController } from '../controllers/admin/admin-controller';

const router = Router();

// USERS
router.get('/whoami', AdminController.whoami);
router.get('/users', AdminController.getAllUsers);
router.get('/users/:id', AdminController.getUser);
router.delete('/users/:id', AdminController.deleteUser);

// PROBLEMS & TESTCASES
router.post('/problems', AdminController.addProblem);
router.post('/problems/:problemId/testcases', AdminController.addTestCase);
router.get('/problems', AdminController.getAllProblems);
router.get('/problems/:id', AdminController.getProblem);
router.get('/problems/:problemId/testcases', AdminController.getAllTestCases);
router.get('/testcases/:id', AdminController.getTestCase);

export default router;
