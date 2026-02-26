import {
	PutObjectCommand,
	DeleteObjectCommand,
	HeadBucketCommand,
	CreateBucketCommand,
	PutBucketPolicyCommand,
} from "@aws-sdk/client-s3";
import { getS3Client } from "../infrastructure/s3-client";
import { v4 as uuidv4 } from "uuid";
import path from "node:path";
import logger from "../infrastructure/logger";

export type UploadFolder = "problem-images" | "company-logos" | "user-avatars";

export interface UploadResult {
	key: string;
	url: string;
}

class UploadService {
	private readonly bucket: string;
	private readonly publicUrl: string;

	constructor() {
		this.bucket = process.env.MINIO_BUCKET || "codegames";
		this.publicUrl = process.env.MINIO_PUBLIC_URL || "http://localhost:9000";
	}

	async ensureBucket(): Promise<void> {
		const s3 = getS3Client();
		try {
			await s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
			logger.info(`Bucket "${this.bucket}" already exists`);
		} catch {
			await s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
			logger.info(`Created bucket "${this.bucket}"`);
			await this.setBucketPublicPolicy();
		}
	}

	private async setBucketPublicPolicy(): Promise<void> {
		const s3 = getS3Client();
		const policy = {
			Version: "2012-10-17",
			Statement: [
				{
					Sid: "PublicRead",
					Effect: "Allow",
					Principal: "*",
					Action: ["s3:GetObject"],
					Resource: [`arn:aws:s3:::${this.bucket}/*`],
				},
			],
		};
		await s3.send(
			new PutBucketPolicyCommand({
				Bucket: this.bucket,
				Policy: JSON.stringify(policy),
			}),
		);
		logger.info(`Set public-read policy on bucket "${this.bucket}"`);
	}

	async upload(
		file: Express.Multer.File,
		folder: UploadFolder,
	): Promise<UploadResult> {
		const s3 = getS3Client();
		const ext = path.extname(file.originalname).toLowerCase();
		const key = `${folder}/${uuidv4()}${ext}`;

		await s3.send(
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: key,
				Body: file.buffer,
				ContentType: file.mimetype,
			}),
		);

		return {
			key,
			url: `${this.publicUrl}/${this.bucket}/${key}`,
		};
	}

	async delete(key: string): Promise<void> {
		const s3 = getS3Client();
		await s3.send(
			new DeleteObjectCommand({
				Bucket: this.bucket,
				Key: key,
			}),
		);
	}
}

export default UploadService;
