import { Router } from "express";
import AdminController from "./admin.controller";

const router = Router();

router.get("/health-check", AdminController.healthCheck);

// SECTION: Problems
router.get("/problems", AdminController.getProblems);
router.get("/problems/search", AdminController.queryProblems);
router.get("/problems/:id", AdminController.getProblemById);
router.post("/problems", AdminController.createProblem);
router.put("/problems/:id", AdminController.updateProblem);
router.delete("/problems/:id", AdminController.deleteProblem);

// SECTION: Test Cases
router.get("/problems/:id/test-cases", AdminController.getTestCasesByProblemId);
router.post("/problems/:id/test-cases", AdminController.addTestCaseToProblem);
router.post(
	"/problems/:id/test-cases/bulk",
	AdminController.bulkAddTestCasesToProblem,
);

// SECTION: Starter Codes
router.get(
	"/problems/:id/starter-codes",
	AdminController.getStarterCodesByProblemId,
);
router.post(
	"/problems/:id/starter-codes",
	AdminController.addStarterCodeToProblem,
);
router.post(
	"/problems/:id/starter-codes/bulk",
	AdminController.bulkAddStarterCodesToProblem,
);

export default router;
