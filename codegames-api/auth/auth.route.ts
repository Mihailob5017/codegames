// codegames-api/auth/auth.route.ts
import Router from "express";
import { imageUpload } from "../upload/multer-config";
import AuthController from "./auth.controller";

const router = Router();

router.post("/register", imageUpload.single("profileImage"), AuthController.register);

export const authRouter = router;
