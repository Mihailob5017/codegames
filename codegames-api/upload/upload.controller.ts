import { z } from "zod";
import { ControllerType } from "../shared/types/common.types";
import { BadRequestError, ValidationError } from "../shared/errors/app-error";
import UploadService from "./upload.service";

const UploadParamsSchema = z.object({
	folder: z.enum(["problem-images", "company-logos", "user-avatars"]),
});

class UploadController {
	private static readonly uploadService = new UploadService();

	static readonly uploadFile: ControllerType<void> = async (req, res) => {
		const parsed = UploadParamsSchema.safeParse(req.params);
		if (!parsed.success) {
			throw new ValidationError(
				"Invalid upload folder",
				z.flattenError(parsed.error).fieldErrors,
			);
		}

		if (!req.file) {
			throw new BadRequestError("No file provided");
		}

		const result = await UploadController.uploadService.upload(
			req.file,
			parsed.data.folder,
		);
		res.status(201).json({ status: "success", data: result });
	};

	static readonly uploadMultiple: ControllerType<void> = async (req, res) => {
		const parsed = UploadParamsSchema.safeParse(req.params);
		if (!parsed.success) {
			throw new ValidationError(
				"Invalid upload folder",
				z.flattenError(parsed.error).fieldErrors,
			);
		}

		const files = req.files as Express.Multer.File[];
		if (!files || files.length === 0) {
			throw new BadRequestError("No files provided");
		}

		const results = await Promise.all(
			files.map((file) =>
				UploadController.uploadService.upload(file, parsed.data.folder),
			),
		);
		res.status(201).json({ status: "success", data: results });
	};

	static readonly deleteFile: ControllerType<void> = async (req, res) => {
		const { key } = req.body;
		if (!key || typeof key !== "string") {
			throw new BadRequestError("File key is required");
		}
		await UploadController.uploadService.delete(key);
		res.status(200).json({ status: "success", message: "File deleted" });
	};
}

export default UploadController;
