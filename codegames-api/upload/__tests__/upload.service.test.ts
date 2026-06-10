import { initTestAppConfig } from "../../shared/test-utils/test-helpers";

jest.mock("node:crypto", () => ({
	...jest.requireActual("node:crypto"),
	randomUUID: jest.fn(() => "fixed-uuid"),
}));

jest.mock("../../infrastructure/s3-client", () => ({
	__esModule: true,
	getS3Client: jest.fn(),
}));

jest.mock("../../infrastructure/logger", () => ({
	__esModule: true,
	default: {
		warn: jest.fn(),
		error: jest.fn(),
		info: jest.fn(),
		debug: jest.fn(),
	},
}));

import {
	PutObjectCommand,
	DeleteObjectCommand,
	HeadBucketCommand,
	CreateBucketCommand,
	PutBucketPolicyCommand,
} from "@aws-sdk/client-s3";
import { getS3Client } from "../../infrastructure/s3-client";
import UploadService from "../upload.service";

const mockSend = jest.fn();
const mockGetS3Client = getS3Client as jest.Mock;

function makeFile(overrides: Partial<Express.Multer.File> = {}) {
	return {
		originalname: "avatar.PNG",
		mimetype: "image/png",
		buffer: Buffer.from("image-bytes"),
		...overrides,
	} as Express.Multer.File;
}

describe("UploadService", () => {
	let service: UploadService;

	beforeAll(() => {
		initTestAppConfig({
			MINIO_BUCKET: "codegames",
			MINIO_PUBLIC_URL: "http://localhost:9000",
		});
	});

	beforeEach(() => {
		mockGetS3Client.mockReturnValue({ send: mockSend });
		mockSend.mockResolvedValue({});
		service = new UploadService();
	});

	describe("upload", () => {
		it("stores the file under a uuid key with a lowercased extension", async () => {
			const result = await service.upload(makeFile(), "user-avatars");

			expect(result).toEqual({
				key: "user-avatars/fixed-uuid.png",
				url: "http://localhost:9000/codegames/user-avatars/fixed-uuid.png",
			});
			expect(mockSend).toHaveBeenCalledWith(expect.any(PutObjectCommand));
			const command = mockSend.mock.calls[0][0] as PutObjectCommand;
			expect(command.input).toMatchObject({
				Bucket: "codegames",
				Key: "user-avatars/fixed-uuid.png",
				ContentType: "image/png",
			});
		});
	});

	describe("delete", () => {
		it("deletes the object by key", async () => {
			await service.delete("user-avatars/fixed-uuid.png");

			expect(mockSend).toHaveBeenCalledWith(
				expect.any(DeleteObjectCommand),
			);
			const command = mockSend.mock.calls[0][0] as DeleteObjectCommand;
			expect(command.input).toEqual({
				Bucket: "codegames",
				Key: "user-avatars/fixed-uuid.png",
			});
		});
	});

	describe("ensureBucket", () => {
		it("does nothing beyond the head check when the bucket exists", async () => {
			await service.ensureBucket();

			expect(mockSend).toHaveBeenCalledTimes(1);
			expect(mockSend).toHaveBeenCalledWith(
				expect.any(HeadBucketCommand),
			);
		});

		it("creates the bucket and applies a public-read policy when missing", async () => {
			mockSend
				.mockRejectedValueOnce(new Error("NotFound"))
				.mockResolvedValue({});

			await service.ensureBucket();

			expect(mockSend).toHaveBeenCalledTimes(3);
			expect(mockSend.mock.calls[1][0]).toBeInstanceOf(
				CreateBucketCommand,
			);
			const policyCommand = mockSend.mock
				.calls[2][0] as PutBucketPolicyCommand;
			expect(policyCommand).toBeInstanceOf(PutBucketPolicyCommand);
			expect(policyCommand.input.Bucket).toBe("codegames");
			expect(
				JSON.parse(policyCommand.input.Policy as string),
			).toMatchObject({
				Statement: [
					expect.objectContaining({
						Effect: "Allow",
						Action: ["s3:GetObject"],
					}),
				],
			});
		});
	});
});
