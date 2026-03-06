import Router from "express";
import { imageUpload } from "../upload/multer-config";
import UserController from "./user.controller";

const router = Router();

// router.post("/login");

router.post(
	"/register",
	imageUpload.single("profileImage"),
	UserController.Register,
);

// router.post("/logout");

// router.post("/refresh");

export default router;
