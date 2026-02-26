import { S3Client } from "@aws-sdk/client-s3";

let s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
	if (!s3Client) {
		s3Client = new S3Client({
			endpoint: process.env.MINIO_ENDPOINT!,
			region: "us-east-1",
			credentials: {
				accessKeyId: process.env.MINIO_ROOT_USER!,
				secretAccessKey: process.env.MINIO_ROOT_PASSWORD!,
			},
			forcePathStyle: true,
		});
	}
	return s3Client;
}
