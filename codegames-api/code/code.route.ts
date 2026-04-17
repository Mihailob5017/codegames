import { Router } from "express";
import CodeController from "./code.controller";
import { codeSubmissionRateLimiter } from "../middleware/rate-limit-middleware";

const router = Router();

router.get("/health-check", CodeController.healthCheck);
router.post("/execute", codeSubmissionRateLimiter, CodeController.executeCode);
router.post("/run", codeSubmissionRateLimiter, CodeController.runCode);
router.get("/languages", CodeController.getSupportedLanguages);
router.get("/starter-code/:problemId", CodeController.getStarterCode);

export const codeRouter = router;
