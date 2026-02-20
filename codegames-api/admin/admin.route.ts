import { Router } from "express";
import AdminController from "./admin.controller";

const router = Router();

router.get("/health-check", AdminController.healthCheck);

export default router;
