import { Router } from "express";
import UploadController from "./upload.controller";
import { imageUpload } from "./multer-config";

const router = Router();

router.post(
	"/:folder",
	imageUpload.single("file"),
	UploadController.uploadFile,
);
router.post(
	"/:folder/bulk",
	imageUpload.array("files", 10),
	UploadController.uploadMultiple,
);
router.delete("/", UploadController.deleteFile);

export const uploadRouter = router;
