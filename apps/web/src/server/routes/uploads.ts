import { config } from "@community/config";
import type { Session } from "@community/lib-server/auth";
import { ensureImageSafe } from "@community/lib-server/content-moderation";
import {
	getSignedUploadUrl,
	uploadFileToS3,
} from "@community/lib-server/storage";
import { createModuleLogger } from "@community/lib-server/logs";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator } from "hono-openapi/zod";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";

const logger = createModuleLogger("uploads");

// Allowed buckets and alias mapping for different user types
const bucketAliasEntries: Array<[string, string]> = [];
for (const [bucketType, bucketName] of Object.entries(
	config.storage.bucketNames,
)) {
	const trimmedName = bucketName.trim();
	const trimmedType = bucketType.trim();

	if (trimmedName.length > 0) {
		bucketAliasEntries.push([trimmedName, trimmedName]);
		bucketAliasEntries.push([trimmedName.toLowerCase(), trimmedName]);
	}

	if (trimmedType.length > 0 && trimmedType !== trimmedName) {
		bucketAliasEntries.push([trimmedType, trimmedName]);
		bucketAliasEntries.push([trimmedType.toLowerCase(), trimmedName]);
	}
}

const BUCKET_ALIAS_MAP = new Map(bucketAliasEntries);

const ALLOWED_BUCKETS = new Set(
	Object.values(config.storage.bucketNames).map((bucket) => bucket.trim()),
);

const resolveBucketName = (bucket: string): string => {
	const normalized = bucket.trim();
	return (
		BUCKET_ALIAS_MAP.get(normalized) ??
		BUCKET_ALIAS_MAP.get(normalized.toLowerCase()) ??
		normalized
	);
};

// Allowed file extensions and content types
const ALLOWED_CONTENT_TYPES = new Map([
	["image/jpeg", [".jpg", ".jpeg"]],
	["image/jpg", [".jpg", ".jpeg"]],
	["image/pjpeg", [".jpg", ".jpeg"]],
	["image/png", [".png"]],
	["image/x-png", [".png"]],
	["image/webp", [".webp"]],
	["image/gif", [".gif"]],
	["application/pdf", [".pdf"]],
	["text/plain", [".txt"]],
	// Add more common file types for submissions
	["application/zip", [".zip"]],
	["application/x-zip-compressed", [".zip"]],
	["application/vnd.ms-powerpoint", [".ppt"]],
	[
		"application/vnd.openxmlformats-officedocument.presentationml.presentation",
		[".pptx"],
	],
	["application/msword", [".doc"]],
	[
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		[".docx"],
	],
	["application/vnd.ms-excel", [".xls"]],
	[
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		[".xlsx"],
	],
	["video/mp4", [".mp4"]],
	["video/quicktime", [".mov"]],
	["video/x-msvideo", [".avi"]],
	["audio/mpeg", [".mp3"]],
	["audio/wav", [".wav"]],
]);

// Maximum file path length
const MAX_PATH_LENGTH = 512;

// Validate file path for security
function validateFilePath(path: string): boolean {
	// Check length
	if (path.length > MAX_PATH_LENGTH) return false;

	// Prevent path traversal attacks
	if (path.includes("..") || path.includes("//") || path.startsWith("/"))
		return false;

	// Ensure path contains only safe characters
	if (!/^[a-zA-Z0-9._\/-]+$/.test(path)) return false;

	// Ensure path doesn't start with sensitive directories
	const sensitivePatterns = [".env", "config", "secret", "key", "password"];
	const lowerPath = path.toLowerCase();
	if (sensitivePatterns.some((pattern) => lowerPath.includes(pattern)))
		return false;

	return true;
}

// Normalize MIME type for consistency (matching client-side logic)
function normalizeMimeType(type: string | undefined): string | undefined {
	if (!type) return undefined;

	const lower = type.toLowerCase();
	switch (lower) {
		case "image/x-png":
			return "image/png";
		case "image/jpg":
		case "image/pjpeg":
			return "image/jpeg";
		default:
			return lower;
	}
}

// Validate content type
function validateContentType(
	contentType: string | undefined,
	filePath: string,
): boolean {
	if (!contentType) return true; // Allow undefined content type

	const normalizedType = normalizeMimeType(contentType);
	if (!normalizedType) return false;

	// Check if normalized content type is allowed
	if (!ALLOWED_CONTENT_TYPES.has(normalizedType)) {
		console.warn(
			`Content type not allowed: ${normalizedType} for file: ${filePath}`,
		);
		return false;
	}

	// Check if file extension matches content type
	const allowedExtensions = ALLOWED_CONTENT_TYPES.get(normalizedType);
	if (allowedExtensions) {
		const hasValidExtension = allowedExtensions.some((ext) =>
			filePath.toLowerCase().endsWith(ext),
		);
		if (!hasValidExtension) {
			console.warn(
				`File extension mismatch: ${filePath} for content type: ${normalizedType}`,
			);
			return false;
		}
	}

	return true;
}

// 构建可公开访问的 URL，优先使用配置端点，兜底用签名链接的域名
const buildPublicUrl = (path: string, signedUrl?: string): string => {
	const normalizedPath = path.replace(/^\/+/, "");

	const candidates = [
		config.storage.endpoints.public,
		process.env.NEXT_PUBLIC_S3_ENDPOINT,
		process.env.S3_PUBLIC_ENDPOINT,
		process.env.S3_ENDPOINT,
	];

	if (signedUrl) {
		try {
			const origin = new URL(signedUrl).origin;
			candidates.push(origin);
		} catch {
			// ignore invalid URL
		}
	}

	const base = candidates
		.filter(Boolean)
		.map((b) => (b as string).trim().replace(/\/+$/, ""))
		.find((b) => b.length > 0);

	return base ? `${base}/${normalizedPath}` : `/${normalizedPath}`;
};

// Check user permission for bucket access
function hasAccessToBucket(bucket: string, user?: Session["user"]): boolean {
	// Public bucket access rules
	if (bucket === config.storage.bucketNames.public) {
		// All authenticated users can upload to public bucket
		return true;
	}

	// Add additional bucket permission logic here as needed
	// For example: private buckets, organization buckets, etc.

	return false;
}

export const uploadsRouter = new Hono<{
	Variables: {
		session: Session["session"];
		user: Session["user"];
	};
}>()
	.basePath("/uploads")
	.post(
		"/signed-upload-url",
		authMiddleware,
		validator(
			"query",
			z
				.object({
					bucket: z
						.string()
						.min(1, "Bucket name is required")
						.max(63, "Bucket name too long")
						.regex(
							/^[a-z0-9][a-z0-9\-]*[a-z0-9]$/,
							"Invalid bucket name format",
						),
					path: z
						.string()
						.min(1, "Path is required")
						.max(
							MAX_PATH_LENGTH,
							`Path too long (max ${MAX_PATH_LENGTH} characters)`,
						)
						.regex(
							/^[a-zA-Z0-9._\/-]+$/,
							"Path contains invalid characters",
						)
						.refine(
							(path) => !path.includes(".."),
							"Path traversal not allowed",
						)
						.refine(
							(path) => !path.includes("//"),
							"Double slashes not allowed",
						)
						.refine(
							(path) => !path.startsWith("/"),
							"Absolute paths not allowed",
						),
					contentType: z
						.string()
						.optional()
						.refine((ct) => {
							if (!ct) return true;
							const normalized = normalizeMimeType(ct);
							return (
								normalized &&
								ALLOWED_CONTENT_TYPES.has(normalized)
							);
						}, "Content type not allowed"),
				})
				.refine(
					(data) => {
						// Cross-field validation: ensure content type matches file extension
						return validateContentType(data.contentType, data.path);
					},
					{
						message: "Content type does not match file extension",
					},
				),
		),
		describeRoute({
			tags: ["Uploads"],
			summary: "Get a signed upload url",
			description: "Get a signed upload url for a given bucket and path",
			responses: {
				200: {
					description: "Returns a signed upload url",
					content: {
						"application/json": {
							schema: resolver(
								z.object({
									signedUrl: z.string(),
									publicUrl: z.string().optional(),
								}),
							),
						},
					},
				},
				400: {
					description: "Bad request - invalid parameters",
				},
				401: {
					description: "Unauthorized - authentication required",
				},
				403: {
					description: "Forbidden - insufficient permissions",
				},
			},
		}),
		async (c) => {
			const { bucket, path, contentType } = c.req.valid("query");
			const user = c.get("user");
			const resolvedBucket = resolveBucketName(bucket);

			// Additional server-side validation
			if (!validateFilePath(path)) {
				throw new HTTPException(400, { message: "Invalid file path" });
			}

			if (!validateContentType(contentType, path)) {
				throw new HTTPException(400, {
					message: "Invalid content type for file extension",
				});
			}

			// Check if bucket is allowed
			if (!ALLOWED_BUCKETS.has(resolvedBucket)) {
				console.error("Bucket not allowed:", {
					requestedBucket: bucket,
					resolvedBucket,
				});
				throw new HTTPException(400, { message: "Bucket not allowed" });
			}

			// Check user permissions for the bucket
			if (!hasAccessToBucket(resolvedBucket, user)) {
				console.error("User lacks bucket access:", {
					requestedBucket: bucket,
					resolvedBucket,
					userId: user?.id,
				});
				throw new HTTPException(403, {
					message: "Insufficient permissions for this bucket",
				});
			}

			try {
				const signedUrl = await getSignedUploadUrl(path, {
					bucket: resolvedBucket,
					contentType,
				});
				const publicUrl = buildPublicUrl(path, signedUrl);
				return c.json({ signedUrl, publicUrl });
			} catch (error) {
				console.error("Failed to generate signed upload URL:", error);
				throw new HTTPException(500, {
					message: "Failed to generate upload URL",
				});
			}
		},
	)
	.post(
		"/direct-upload",
		authMiddleware,
		describeRoute({
			tags: ["Uploads"],
			summary: "Direct file upload",
			description:
				"Directly upload a file to S3 storage (fallback method)",
			responses: {
				200: {
					description: "Returns the uploaded file URL",
					content: {
						"application/json": {
							schema: resolver(
								z.object({
									fileUrl: z.string(),
									publicUrl: z.string().optional(),
								}),
							),
						},
					},
				},
				400: {
					description: "Bad request - invalid parameters",
				},
				401: {
					description: "Unauthorized - authentication required",
				},
				403: {
					description: "Forbidden - insufficient permissions",
				},
			},
		}),
		async (c) => {
			const formData = await c.req.formData();
			const file = formData.get("file") as File | null;
			const bucket = formData.get("bucket") as string | null;
			const path = formData.get("path") as string | null;
			const contentType = formData.get("contentType") as
				| string
				| null
				| undefined;
			const user = c.get("user");

			if (!file) {
				throw new HTTPException(400, { message: "File is required" });
			}

			if (!bucket) {
				throw new HTTPException(400, { message: "Bucket is required" });
			}

			if (!path) {
				throw new HTTPException(400, {
					message: "File path is required",
				});
			}

			const resolvedBucket = resolveBucketName(bucket);

			if (!validateFilePath(path)) {
				throw new HTTPException(400, { message: "Invalid file path" });
			}

			// Validate content type
			if (!validateContentType(contentType || undefined, path)) {
				throw new HTTPException(400, {
					message: "Invalid content type for file extension",
				});
			}

			// Check if bucket is allowed
			if (!ALLOWED_BUCKETS.has(resolvedBucket)) {
				console.error("Bucket not allowed:", {
					requestedBucket: bucket,
					resolvedBucket,
				});
				throw new HTTPException(400, { message: "Bucket not allowed" });
			}

			// Check user permissions for the bucket
			if (!hasAccessToBucket(resolvedBucket, user)) {
				console.error("User lacks bucket access:", {
					requestedBucket: bucket,
					resolvedBucket,
					userId: user?.id,
				});
				throw new HTTPException(403, {
					message: "Insufficient permissions for this bucket",
				});
			}

			try {
				// Read file content
				const arrayBuffer = await file.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);

				// Upload to S3
				await uploadFileToS3(path, {
					bucket: resolvedBucket,
					body: buffer,
					contentType: contentType || file.type || undefined,
				});

				// Build public URL
				const fileUrl = buildPublicUrl(path);

				return c.json({ fileUrl, publicUrl: fileUrl });
			} catch (error) {
				console.error("Failed to upload file directly:", error);
				throw new HTTPException(500, {
					message: "Failed to upload file",
				});
			}
		},
	)
	.post(
		"/moderate-image",
		authMiddleware,
		validator(
			"json",
			z.object({
				imageUrl: z.string().url("请提供有效的图片地址"),
				mode: z.enum(["avatar", "content"]).default("content"),
			}),
		),
		describeRoute({
			tags: ["Uploads"],
			summary: "Moderate an uploaded image",
			description: "检查图片是否符合安全要求",
		}),
		async (c) => {
			const { imageUrl, mode } = c.req.valid("json");
			const user = c.get("user");
			const requestId = crypto.randomUUID();

			// 版本标识日志 - 确认新版本代码生效
			logger.info(`[v1.1-fix] 图片审核请求 [${requestId}]:`, {
				imageUrl,
				mode,
				userId: user?.id,
				timestamp: new Date().toISOString(),
				env: process.env.NODE_ENV || "development",
			});

			try {
				const moderation = await ensureImageSafe(imageUrl, mode, {
					skipIfEmpty: false,
				});

				logger.info(`[v1.1-fix] 图片审核完成 [${requestId}]:`, {
					imageUrl,
					mode,
					isApproved: moderation.isApproved,
					reason: moderation.reason,
					suggestion: moderation.result?.suggestion,
					label: moderation.result?.label,
				});

				if (!moderation.isApproved) {
					// 检查是否为审核服务异常
					if (
						moderation.reason?.includes("审核服务异常") ||
						moderation.reason?.includes("审核失败") ||
						moderation.reason?.includes("允许通过")
					) {
						logger.info(
							`[v1.1-fix] 图片审核服务异常，但允许图片通过 [${requestId}]:`,
							{
								imageUrl,
								reason: moderation.reason,
							},
						);
						return c.json({
							success: true,
							result: {
								suggestion: "Pass",
								warning: "审核服务不可用，已自动通过",
								originalReason: moderation.reason,
							},
						});
					}

					// 真正的违规内容拒绝
					const violationMessage = "发布内容含违规信息，请修改后重试";
					logger.error(`[v1.1-fix] 图片审核未通过 [${requestId}]:`, {
						imageUrl,
						reason: moderation.reason,
						suggestion: moderation.result?.suggestion,
						label: moderation.result?.label,
						subLabel: moderation.result?.subLabel,
						score: moderation.result?.score,
					});
					return c.json(
						{
							success: false,
							message: moderation.reason ?? violationMessage,
							result: moderation.result,
						},
						400,
					);
				}

				logger.info(`[v1.1-fix] 图片审核通过 [${requestId}]:`, {
					imageUrl,
					suggestion: moderation.result?.suggestion,
				});
				return c.json({
					success: true,
					result: moderation.result,
				});
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				const stack = error instanceof Error ? error.stack : undefined;

				logger.error(
					`[v1.1-fix] 图片审核服务异常，允许图片通过 [${requestId}]:`,
					{
						error: errorMessage,
						imageUrl,
						mode,
						stack,
					},
				);

				// 审核服务异常时允许图片通过，而不是返回错误
				return c.json({
					success: true,
					result: {
						suggestion: "Pass",
						warning: "审核服务异常，已自动通过",
						error: errorMessage,
					},
				});
			}
		},
	);
