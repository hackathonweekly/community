/**
 * Storage module - S3-based file storage
 *
 * This module provides S3 file upload capabilities with signed URLs.
 * Only S3-compatible storage is supported.
 */

import {
	DeleteObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "@community/lib-server/logs";

// ============================================================================
// S3 Client
// ============================================================================

let s3Client: S3Client | null = null;
let s3ClientForPresign: S3Client | null = null;

const resolveBucketName = (bucket: string): string => {
	if (bucket !== "public") {
		return bucket;
	}

	const publicBucket = process.env.S3_BUCKET_PUBLIC?.trim();
	if (!publicBucket) {
		throw new Error("Missing env variable S3_BUCKET_PUBLIC");
	}

	return publicBucket;
};

const getS3Client = () => {
	if (s3Client) {
		return s3Client;
	}

	const s3Endpoint = process.env.S3_ENDPOINT as string;
	if (!s3Endpoint) {
		throw new Error("Missing env variable S3_ENDPOINT");
	}

	const s3Region = (process.env.S3_REGION as string) || "auto";

	const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID as string;
	if (!s3AccessKeyId) {
		throw new Error("Missing env variable S3_ACCESS_KEY_ID");
	}

	const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY as string;
	if (!s3SecretAccessKey) {
		throw new Error("Missing env variable S3_SECRET_ACCESS_KEY");
	}

	s3Client = new S3Client({
		region: s3Region,
		endpoint: s3Endpoint,
		forcePathStyle: false, // 使用虚拟主机式 URL
		credentials: {
			accessKeyId: s3AccessKeyId,
			secretAccessKey: s3SecretAccessKey,
		},
	});

	return s3Client;
};

/**
 * 专用于预签名的 S3 Client。
 */
const getS3ClientForPresign = () => {
	if (s3ClientForPresign) {
		return s3ClientForPresign;
	}

	const s3Endpoint = process.env.S3_ENDPOINT as string;
	if (!s3Endpoint) {
		throw new Error("Missing env variable S3_ENDPOINT");
	}

	const s3Region = (process.env.S3_REGION as string) || "auto";
	const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID as string;
	if (!s3AccessKeyId) {
		throw new Error("Missing env variable S3_ACCESS_KEY_ID");
	}
	const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY as string;
	if (!s3SecretAccessKey) {
		throw new Error("Missing env variable S3_SECRET_ACCESS_KEY");
	}

	// 与 getS3Client 使用相同配置，单独缓存以隔离预签名中间件设置
	s3ClientForPresign = new S3Client({
		region: s3Region,
		endpoint: s3Endpoint,
		forcePathStyle: false,
		credentials: {
			accessKeyId: s3AccessKeyId,
			secretAccessKey: s3SecretAccessKey,
		},
	});

	// 移除灵活校验和中间件，避免在预签名URL中附带 x-amz-sdk-checksum-* 查询参数
	try {
		// 名称来自 @aws-sdk/middleware-flexible-checksums
		// 如果 SDK 版本变动导致名称不同，移除失败也不会影响功能
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(s3ClientForPresign.middlewareStack as any).remove?.(
			"flexibleChecksumsMiddleware",
		);
	} catch {}

	return s3ClientForPresign;
};

// ============================================================================
// Signed URL Generation
// ============================================================================

/**
 * Generate a signed URL for uploading a file to S3
 *
 * @param path - The file path in the bucket
 * @param options - Upload options
 * @param options.bucket - The bucket name
 * @param options.contentType - Optional content type for the file
 * @returns A signed URL valid for 60 seconds
 */
export async function getSignedUploadUrl(
	path: string,
	options: {
		bucket: string;
		contentType?: string;
	},
): Promise<string> {
	const { bucket, contentType } = options;
	const s3Client = getS3ClientForPresign();

	try {
		const command = new PutObjectCommand({
			Bucket: resolveBucketName(bucket),
			Key: path,
			...(contentType && { ContentType: contentType }),
		});

		return await getS3SignedUrl(s3Client, command, {
			expiresIn: 60,
		});
	} catch (e) {
		logger.error(e);
		throw new Error("Could not get signed upload url");
	}
}

export async function uploadFileToS3(
	path: string,
	options: {
		bucket: string;
		body: Buffer | Uint8Array | string;
		contentType?: string;
	},
): Promise<void> {
	const { bucket, body, contentType } = options;
	const s3Client = getS3Client();

	try {
		const command = new PutObjectCommand({
			Bucket: resolveBucketName(bucket),
			Key: path,
			Body: body,
			...(contentType && { ContentType: contentType }),
		});

		await s3Client.send(command);
	} catch (e) {
		logger.error(e);
		throw new Error("Could not upload file to S3");
	}
}

export async function deleteFileFromS3(
	path: string,
	options: {
		bucket: string;
	},
): Promise<void> {
	const { bucket } = options;
	const s3Client = getS3Client();

	try {
		const command = new DeleteObjectCommand({
			Bucket: resolveBucketName(bucket),
			Key: path,
		});

		await s3Client.send(command);
	} catch (e) {
		logger.error(e);
		throw new Error("Could not delete file from S3");
	}
}

// Re-export URL utilities
export * from "./url";
