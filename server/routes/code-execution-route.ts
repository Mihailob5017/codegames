import { Router } from 'express';
import { CodeExecutionController } from '../controllers/code-execution/code-execution-controller';
import { AuthMiddleware } from '../middlewares/auth-middleware';
import { VerifiedMiddleware } from '../middlewares/verified-middleware';

const router = Router();

router.post(
	'/execute',
	AuthMiddleware,
	VerifiedMiddleware,
	CodeExecutionController.executeCode
);
router.get(
	'/languages',
	AuthMiddleware,
	VerifiedMiddleware,
	CodeExecutionController.getSupportedLanguages
);

export default router;
