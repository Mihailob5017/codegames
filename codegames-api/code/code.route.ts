import { Router } from "express";
import CodeController from "./code.controller";

const router = Router();

router.get("/health-check", CodeController.healthCheck);
router.post("/execute", CodeController.executeCode);
router.post("/run", CodeController.runCode);
router.get("/get-languages", CodeController.getSupportedLanguages);
router.get("/get-starter-code/:problemId", CodeController.getStarterCode);

export const codeRouter = router;
