import { S3Client } from "@aws-sdk/client-s3";
import { getAppConfig } from "./app-config";

let s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
	if (!s3Client) {
		const config = getAppConfig();
		s3Client = new S3Client({
			endpoint: config.MINIO_ENDPOINT,
			region: "us-east-1",
			credentials: {
				accessKeyId: config.MINIO_ROOT_USER,
				secretAccessKey: config.MINIO_ROOT_PASSWORD,
			},
			forcePathStyle: true,
		});
	}
	return s3Client;
}
