import {
	createTencentImageModerationClientFromEnv,
	createTencentTextModerationClientFromEnv,
	type ImageModerationOptions,
	type ImageModerationResult,
	type TextModerationResult,
} from "@/lib/tencent-cloud";

const VIOLATION_MESSAGE = "发布内容含违规信息，请修改后重试";
const IMAGE_VIOLATION_MESSAGE = "发布内容含违规信息，请修改后重试";

const TEXT_MODE_BIZ_TYPES = {
	content: "content_input",
	nickname: "nickname_input",
} as const;

export type TextModerationMode = keyof typeof TEXT_MODE_BIZ_TYPES;

/**
 * 文本审核配置——所有内容类型在此集中声明
 */
const CONTENT_RULES = {
	user_name: "nickname",
	user_bio: "content",
	user_username: "content",
	user_region: "content",
	user_role: "content",
	user_current_work: "content",
	user_offer: "content",
	user_looking_for: "content",
	user_life_status: "content",
	user_wechat_id: "content",
	user_real_name: "content",
	user_id_card: "content",
	user_shipping_name: "content",
	user_shipping_address: "content",
	user_shipping_phone: "content",
	event_title: "content",
	event_short_description: "content",
	event_rich_content: "content",
	project_title: "content",
	project_description: "content",
	comment_content: "content",
	building_plan: "content",
	building_checkin_title: "content",
	building_checkin_content: "content",
	building_checkin_next_plan: "content",
	organization_name: "content",
	organization_summary: "content",
	organization_description: "content",
	organization_application_reason: "content",
	task_title: "content",
	task_description: "content",
	task_submission_note: "content",
	task_review_note: "content",
} as const satisfies Record<string, TextModerationMode>;

export type ContentType = keyof typeof CONTENT_RULES;

type ContentTypeConstKey = Uppercase<ContentType>;

/**
 * 内容类型常量与类型定义
 */
export const ContentType = Object.freeze(
	Object.fromEntries(
		(Object.keys(CONTENT_RULES) as ContentType[]).map((key) => [
			key.toUpperCase(),
			key,
		]),
	) as Record<ContentTypeConstKey, ContentType>,
);

/**
 * 内容审核结果
 */
export interface ContentModerationResult {
	isApproved: boolean;
	suggestion: "Pass" | "Block" | "Review";
	label: string;
	score: number;
	keywords: string[];
	subLabel: string;
	reason?: string;
}

function getBizType(contentType: ContentType): string {
	const mode = CONTENT_RULES[contentType];
	if (!mode) {
		throw new Error(`Unknown content type: ${contentType}`);
	}

	return TEXT_MODE_BIZ_TYPES[mode];
}

/**
 * 统一的文本内容审核函数
 */
export async function moderateContent(
	content: string | null | undefined,
	contentType: ContentType,
): Promise<ContentModerationResult> {
	if (!content || content.trim().length === 0) {
		return {
			isApproved: true,
			suggestion: "Pass",
			label: "Normal",
			score: 0,
			keywords: [],
			subLabel: "",
			reason: "空内容，跳过审核",
		};
	}

	const cleanContent = content.trim();
	const bizType = getBizType(contentType);

	try {
		const client = createTencentTextModerationClientFromEnv();

		const timeoutPromise = new Promise<never>((_, reject) => {
			setTimeout(() => reject(new Error("TIMEOUT")), 10000);
		});

		const result: TextModerationResult = await Promise.race([
			client.moderateText(cleanContent, bizType),
			timeoutPromise,
		]);

		let isApproved = false;
		let reason = "";

		if (result.suggestion === "Pass") {
			isApproved = true;
		} else {
			isApproved = false;
			reason = VIOLATION_MESSAGE;
		}

		if (!isApproved) {
			console.info("Content moderation rejected:", {
				contentType,
				suggestion: result.suggestion,
				label: result.label,
				subLabel: result.subLabel,
				score: result.score,
			});
		}

		return {
			isApproved,
			suggestion: result.suggestion,
			label: result.label,
			score: result.score,
			keywords: result.keywords,
			subLabel: result.subLabel,
			reason,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		const isTimeout = errorMessage.includes("TIMEOUT");
		const isNetworkError =
			errorMessage.includes("ENOTFOUND") ||
			errorMessage.includes("ECONNRESET") ||
			errorMessage.includes("timeout");
		const isAuthError =
			errorMessage.includes("AuthFailure") ||
			errorMessage.includes("InvalidCredentials") ||
			errorMessage.includes("SecretId") ||
			errorMessage.includes("SecretKey");
		const isQuotaError =
			errorMessage.includes("LimitExceeded") ||
			errorMessage.includes("QuotaExceeded");

		console.error(`内容审核失败 [${contentType}]:`, {
			error: errorMessage,
			contentLength: cleanContent.length,
			contentType,
			isTimeout,
			isNetworkError,
			isAuthError,
			isQuotaError,
		});

		let reason = "审核服务异常，允许发布";
		if (isTimeout) {
			reason = "审核服务响应超时，允许发布";
		} else if (isNetworkError) {
			reason = "审核服务网络异常，允许发布";
		} else if (isAuthError) {
			reason = "审核服务认证失败，允许发布";
		} else if (isQuotaError) {
			reason = "审核服务配额不足，允许发布";
		}

		return {
			isApproved: true,
			suggestion: "Pass",
			label: "SystemError",
			score: 0,
			keywords: [],
			subLabel: "",
			reason,
		};
	}
}

/**
 * 批量内容审核
 */
export async function moderateMultipleContent(
	contents: Array<{
		content: string | null | undefined;
		contentType: ContentType;
	}>,
): Promise<ContentModerationResult[]> {
	return Promise.all(
		contents.map(({ content, contentType }) =>
			moderateContent(content, contentType),
		),
	);
}

export interface ContentFieldSchemaEntry {
	type: ContentType;
	skipIfEmpty?: boolean;
}

export type ContentFieldSchema<TKey extends string> = Record<
	TKey,
	ContentFieldSchemaEntry
>;

type SchemaData<TKey extends string> = Partial<
	Record<TKey, string | null | undefined>
>;

/**
 * 通用内容校验函数，按照给定字段映射跑审核
 */
export async function validateContentFields<TKey extends string>(
	data: SchemaData<TKey>,
	schema: ContentFieldSchema<TKey>,
): Promise<{
	isValid: boolean;
	errors: Record<TKey, string>;
	results: Record<TKey, ContentModerationResult>;
}> {
	const errors: Partial<Record<TKey, string>> = {};
	const results: Partial<Record<TKey, ContentModerationResult>> = {};

	await Promise.all(
		(Object.keys(schema) as TKey[]).map(async (key) => {
			const field = schema[key];
			const value = data[key];

			if (value === undefined) {
				return;
			}

			if (shouldSkipContent(value, field.skipIfEmpty)) {
				return;
			}

			try {
				const result = await moderateContent(value, field.type);
				results[key] = result;

				if (!result.isApproved && result.reason) {
					errors[key] = result.reason;
				}
			} catch (error) {
				errors[key] = "内容审核失败，请稍后重试";
			}
		}),
	);

	return {
		isValid: Object.keys(errors).length === 0,
		errors: errors as Record<TKey, string>,
		results: results as Record<TKey, ContentModerationResult>,
	};
}

/**
 * 根据 schema 生成具名校验器
 */
export function createContentValidator<TKey extends string>(
	schema: ContentFieldSchema<TKey>,
) {
	return (
		data: SchemaData<TKey>,
	): Promise<{
		isValid: boolean;
		errors: Record<TKey, string>;
		results: Record<TKey, ContentModerationResult>;
	}> => validateContentFields(data, schema);
}

export async function validateSingleContent(
	content: string | null | undefined,
	contentType: ContentType,
	options: { skipIfEmpty?: boolean } = {},
): Promise<{
	isValid: boolean;
	error?: string;
	result?: ContentModerationResult;
}> {
	const skipEmpty = options.skipIfEmpty ?? true;
	if (shouldSkipContent(content, skipEmpty)) {
		return { isValid: true };
	}

	try {
		const result = await moderateContent(content, contentType);
		if (!result.isApproved && result.reason) {
			return { isValid: false, error: result.reason, result };
		}
		return { isValid: true, result };
	} catch (error) {
		return { isValid: false, error: "内容审核失败，请稍后重试" };
	}
}

function shouldSkipContent(
	content: string | null | undefined,
	skipIfEmpty = true,
): boolean {
	if (content === undefined) {
		return true;
	}

	if (!skipIfEmpty) {
		return false;
	}

	if (content === null) {
		return true;
	}

	return typeof content === "string" && content.trim().length === 0;
}

// 图片内容审核配置
const IMAGE_MODE_BIZ_TYPES = {
	avatar: "avatar_input",
	content: "image_input",
} as const;

export type ImageModerationMode = keyof typeof IMAGE_MODE_BIZ_TYPES;

/**
 * 统一的图片内容审核函数
 */
export async function moderateImageContent(
	options: Omit<ImageModerationOptions, "bizType"> & {
		mode: ImageModerationMode;
	},
): Promise<ImageModerationResult> {
	const client = createTencentImageModerationClientFromEnv();
	return client.moderateImage({
		...options,
		bizType: IMAGE_MODE_BIZ_TYPES[options.mode],
	});
}

/**
 * 检查图片内容是否安全
 */
export async function isImageContentSafe(
	options: Omit<ImageModerationOptions, "bizType"> & {
		mode: ImageModerationMode;
	},
): Promise<boolean> {
	const result = await moderateImageContent(options);
	return result.suggestion === "Pass";
}

export interface ImageModerationCheckResult {
	isApproved: boolean;
	reason?: string;
	result?: ImageModerationResult;
}

export interface ImageModerationBatchResult {
	isApproved: boolean;
	failedIndex?: number;
	failedUrl?: string | null | undefined;
	results: ImageModerationCheckResult[];
}

function shouldSkipImage(
	imageUrl: string | null | undefined,
	skipIfEmpty = true,
): boolean {
	if (imageUrl === undefined) {
		return true;
	}

	if (!skipIfEmpty) {
		return false;
	}

	if (imageUrl === null) {
		return true;
	}

	return typeof imageUrl === "string" && imageUrl.trim().length === 0;
}

const isImageModerationDisabled = () => {
	const flag =
		process.env.DISABLE_IMAGE_MODERATION ||
		process.env.NEXT_PUBLIC_DISABLE_IMAGE_MODERATION;
	if (!flag) return false;
	const normalized = flag.toString().toLowerCase();
	return normalized === "1" || normalized === "true" || normalized === "yes";
};

export async function ensureImageSafe(
	imageUrl: string | null | undefined,
	mode: ImageModerationMode,
	options: { skipIfEmpty?: boolean } = {},
): Promise<ImageModerationCheckResult> {
	const skipEmpty = options.skipIfEmpty ?? true;

	// Temporary bypass: allow turning off image moderation via env flag
	if (isImageModerationDisabled()) {
		return {
			isApproved: true,
			reason: "图片审核已禁用（DISABLE_IMAGE_MODERATION）",
		};
	}

	if (shouldSkipImage(imageUrl, skipEmpty)) {
		return { isApproved: true, reason: "空图片，跳过审核" };
	}

	const normalizedUrl = typeof imageUrl === "string" ? imageUrl.trim() : "";

	if (!normalizedUrl) {
		return {
			isApproved: false,
			reason: IMAGE_VIOLATION_MESSAGE,
		};
	}

	try {
		const result = await moderateImageContent({
			fileUrl: normalizedUrl,
			mode,
		});

		if (result.suggestion === "Pass") {
			return { isApproved: true, result };
		}

		console.info("Image moderation rejected:", {
			imageUrl,
			mode,
			suggestion: result.suggestion,
			label: result.label,
			subLabel: result.subLabel,
			score: result.score,
		});

		return {
			isApproved: false,
			reason: IMAGE_VIOLATION_MESSAGE,
			result,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : String(error);

		// 检查是否为特定的腾讯云错误
		const isTencentError =
			errorMessage.includes("TencentCloudSDKException") ||
			errorMessage.includes("ImageDownloadError") ||
			errorMessage.includes("ResourceUnavailable");

		const isNetworkError =
			errorMessage.includes("ENOTFOUND") ||
			errorMessage.includes("ECONNREFUSED") ||
			errorMessage.includes("timeout");

		console.warn("图片审核服务异常，允许图片通过:", {
			error: errorMessage,
			imageUrl,
			mode,
			errorType: isTencentError
				? "TencentCloud"
				: isNetworkError
					? "Network"
					: "Unknown",
		});

		// 审核服务异常时允许通过，记录详细原因
		let detailedReason = "图片审核服务异常，允许通过";
		if (isTencentError) {
			detailedReason = "腾讯云审核服务异常，允许通过";
		} else if (isNetworkError) {
			detailedReason = "网络连接异常，审核服务不可用，允许通过";
		}

		return {
			isApproved: true,
			reason: detailedReason,
		};
	}
}

export async function ensureImagesSafe(
	imageUrls: Array<string | null | undefined>,
	mode: ImageModerationMode,
	options: { skipIfEmpty?: boolean } = {},
): Promise<ImageModerationBatchResult> {
	const results: ImageModerationCheckResult[] = [];

	for (const [index, imageUrl] of imageUrls.entries()) {
		const result = await ensureImageSafe(imageUrl, mode, options);
		results.push(result);

		if (!result.isApproved) {
			return {
				isApproved: false,
				failedIndex: index,
				failedUrl: imageUrl,
				results,
			};
		}
	}

	return {
		isApproved: true,
		results,
	};
}
