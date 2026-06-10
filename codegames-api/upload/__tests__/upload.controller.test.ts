import {
	createMockNext,
	createMockRequest,
	createMockResponse,
} from "../../shared/test-utils/test-helpers";
import {
	BadRequestError,
	ValidationError,
} from "../../shared/errors/app-error";

jest.mock("../upload.service");

import UploadService from "../upload.service";
import UploadController from "../upload.controller";

const MockUploadService = UploadService as jest.MockedClass<
	typeof UploadService
>;

const uploadResult = {
	key: "user-avatars/fixed-uuid.png",
	url: "http://localhost:9000/codegames/user-avatars/fixed-uuid.png",
};

function makeFile() {
	return { originalname: "avatar.png" } as Express.Multer.File;
}

describe("UploadController", () => {
	let mockService: jest.Mocked<UploadService>;
	const next = createMockNext();

	beforeAll(() => {
		mockService = MockUploadService.mock
			.instances[0] as jest.Mocked<UploadService>;
	});

	beforeEach(() => {
		mockService.upload.mockResolvedValue(uploadResult);
		mockService.delete.mockResolvedValue(undefined);
	});

	describe("uploadFile", () => {
		it("uploads the file and responds 201 with key and url", async () => {
			const req = createMockRequest({
				params: { folder: "user-avatars" },
			});
			(req as { file?: Express.Multer.File }).file = makeFile();
			const res = createMockResponse();

			await UploadController.uploadFile(req as never, res, next);

			expect(mockService.upload).toHaveBeenCalledWith(
				req.file,
				"user-avatars",
			);
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith({
				status: "success",
				data: uploadResult,
			});
		});

		it("throws a ValidationError for an unknown folder", async () => {
			const req = createMockRequest({
				params: { folder: "not-a-folder" },
			});
			const res = createMockResponse();

			await expect(
				UploadController.uploadFile(req as never, res, next),
			).rejects.toThrow(ValidationError);
			expect(mockService.upload).not.toHaveBeenCalled();
		});

		it("throws a BadRequestError when no file is attached", async () => {
			const req = createMockRequest({
				params: { folder: "user-avatars" },
			});
			const res = createMockResponse();

			await expect(
				UploadController.uploadFile(req as never, res, next),
			).rejects.toThrow(BadRequestError);
		});
	});

	describe("uploadMultiple", () => {
		it("uploads every file and responds 201 with all results", async () => {
			const req = createMockRequest({
				params: { folder: "problem-images" },
			});
			(req as { files?: Express.Multer.File[] }).files = [
				makeFile(),
				makeFile(),
			];
			const res = createMockResponse();

			await UploadController.uploadMultiple(req as never, res, next);

			expect(mockService.upload).toHaveBeenCalledTimes(2);
			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith({
				status: "success",
				data: [uploadResult, uploadResult],
			});
		});

		it("throws a BadRequestError when no files are attached", async () => {
			const req = createMockRequest({
				params: { folder: "problem-images" },
			});
			(req as { files?: Express.Multer.File[] }).files = [];
			const res = createMockResponse();

			await expect(
				UploadController.uploadMultiple(req as never, res, next),
			).rejects.toThrow(BadRequestError);
		});
	});

	describe("deleteFile", () => {
		it("deletes by key and responds 200", async () => {
			const req = createMockRequest({
				body: { key: "user-avatars/fixed-uuid.png" },
			});
			const res = createMockResponse();

			await UploadController.deleteFile(req as never, res, next);

			expect(mockService.delete).toHaveBeenCalledWith(
				"user-avatars/fixed-uuid.png",
			);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				status: "success",
				message: "File deleted",
			});
		});

		it("throws a ValidationError when the key is missing", async () => {
			const req = createMockRequest({ body: {} });
			const res = createMockResponse();

			await expect(
				UploadController.deleteFile(req as never, res, next),
			).rejects.toThrow(ValidationError);
			expect(mockService.delete).not.toHaveBeenCalled();
		});
	});
});
