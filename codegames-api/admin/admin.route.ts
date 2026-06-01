import { Router } from "express";
import { ProblemsController } from "./problems";
import { TestCasesController } from "./test-cases";
import { StarterCodesController } from "./starter-codes";

const router = Router();

router.get("/health-check", (_req, res) => {
	res.status(200).send("Hello from CodeGames API!");
});

// ─── Problems ─────────────────────────────────────────────────────────────────
router.get("/problems", ProblemsController.getProblems);
router.get("/problems/search", ProblemsController.queryProblems);
router.get("/problems/:id", ProblemsController.getProblemById);
router.post("/problems", ProblemsController.createProblem);
router.put("/problems/:id", ProblemsController.updateProblem);
router.delete("/problems/:id", ProblemsController.deleteProblem);

// ─── Test Cases ───────────────────────────────────────────────────────────────
router.get(
	"/problems/:id/test-cases",
	TestCasesController.getTestCasesByProblemId,
);
router.post(
	"/problems/:id/test-cases",
	TestCasesController.addTestCaseToProblem,
);
router.post(
	"/problems/:id/test-cases/bulk",
	TestCasesController.bulkAddTestCasesToProblem,
);

// ─── Starter Codes ────────────────────────────────────────────────────────────
router.get(
	"/problems/:id/starter-codes",
	StarterCodesController.getStarterCodesByProblemId,
);
router.post(
	"/problems/:id/starter-codes",
	StarterCodesController.addStarterCodeToProblem,
);
router.post(
	"/problems/:id/starter-codes/bulk",
	StarterCodesController.bulkAddStarterCodesToProblem,
);

export default router;
