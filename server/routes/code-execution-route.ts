import { Router } from 'express';
import { CodeExecutionController } from '../controllers/code-execution/code-execution-controller';

const router = Router();

router.post('/execute', CodeExecutionController.executeCode);
router.get('/languages', CodeExecutionController.getSupportedLanguages);

export default router;
