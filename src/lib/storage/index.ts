/**
 * Storage module - S3-based file storage
 *
 * This module provides S3 file upload capabilities with signed URLs.
 * Only S3-compatible storage is supported.
 */

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "@/lib/logs";

// ============================================================================
// S3 Client
// ============================================================================

let s3Client: S3Client | null = null;

/**
 * Middleware to inject Appid header for Tencent Cloud COS compatibility
 * This is required when using AWS SDK v3 with Tencent COS virtual-hosted-style URLs
 */
const tencentCosMiddleware = {
	name: "tencentCosMiddleware",
	middleware: (next: any, _context: any) => {
		return async (args: any): Promise<any> => {
			// Check if this is a Tencent COS endpoint and if Appid header is missing
			const endpoint = args?.request?.hostname || "";
			const headers = args?.request?.headers || {};

			// Detect Tencent COS endpoint by checking for .myqcloud.com
			if (endpoint.includes(".myqcloud.com") && !headers.Appid) {
				// Extract Appid from bucket name (Tencent COS format: bucketname-appid)
				const bucket = args?.input?.Bucket || "";
				// Match patterns like "hackweek-public-1303088253" format
				const appidMatch = bucket.match(/-(\d+)$/);

				let appidToUse: string | null = null;

				if (appidMatch) {
					appidToUse = appidMatch[1];
				} else if (process.env.S3_APPID) {
					// Use explicit S3_APPID from env if available
					appidToUse = process.env.S3_APPID;
				} else {
					// Last resort: extract any numeric part from common bucket patterns
					const anyNumberMatch = bucket.match(/(\d+)/);
					if (anyNumberMatch) {
						appidToUse = anyNumberMatch[1];
					}
				}

				if (appidToUse) {
					// Inject Appid header for Tencent COS
					args.request.headers = {
						...headers,
						Appid: appidToUse,
					};
				} else {
					logger.warn(
						"无法从bucket名称中提取Appid，可能导致COS请求失败",
						{
							bucket,
							endpoint,
						},
					);
				}
			}

			return next(args);
		};
	},
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

	// Apply middleware to all S3 operations for Tencent COS compatibility
	s3Client.middlewareStack.add(
		tencentCosMiddleware.middleware.bind(tencentCosMiddleware),
		{ step: "build" },
	);

	return s3Client;
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
	const s3Client = getS3Client();

	try {
		const command = new PutObjectCommand({
			Bucket: bucket,
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
			Bucket: bucket,
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

// Re-export URL utilities
export * from "./url";
