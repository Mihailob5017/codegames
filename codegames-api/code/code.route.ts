import { Router } from "express";
import CodeController from "./code.controller";

const router = Router();

router.get("/health-check", CodeController.healthCheck);
router.post("/execute", CodeController.executeCode);
router.post("/run", CodeController.runCode);

export const codeRouter = router;
