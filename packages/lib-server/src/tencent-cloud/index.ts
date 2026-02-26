import type { ClientConfig } from "tencentcloud-sdk-nodejs/tencentcloud/common/interface";
import { Client as TextModerationServiceClient } from "tencentcloud-sdk-nodejs/tencentcloud/services/tms/v20201229/tms_client";
import type {
	TextModerationRequest,
	TextModerationResponse,
} from "tencentcloud-sdk-nodejs/tencentcloud/services/tms/v20201229/tms_models";
import { Client as ImageModerationServiceClient } from "tencentcloud-sdk-nodejs/tencentcloud/services/ims/v20201229/ims_client";
import type {
	ImageModerationRequest,
	ImageModerationResponse,
	LabelResult as ImageLabelResult,
	ObjectResult as ImageObjectResult,
	OcrResult as ImageOcrResult,
	LibResult as ImageLibResult,
	RecognitionResult as ImageRecognitionResult,
} from "tencentcloud-sdk-nodejs/tencentcloud/services/ims/v20201229/ims_models";
import { readFile } from "node:fs/promises";

/**
 * 腾讯云文本内容安全配置
 */
export interface TencentCloudConfig {
	secretId: string;
	secretKey: string;
	region?: string;
}

/**
 * 文本检测结果
 */
export interface TextModerationResult {
	suggestion: "Pass" | "Block" | "Review";
	label: string;
	score: number;
	keywords: string[];
	subLabel: string;
}

/**
 * 图片检测结果
 */
export interface ImageModerationResult {
	suggestion: "Pass" | "Block" | "Review";
	label: string;
	subLabel: string;
	score: number;
	dataId?: string;
	bizType?: string;
	extra?: string | null;
	fileMD5?: string;
	labelResults: ImageLabelResult[];
	objectResults: ImageObjectResult[];
	ocrResults: ImageOcrResult[];
	libResults: ImageLibResult[];
	recognitionResults: ImageRecognitionResult[];
}

/**
 * 图片审核请求选项
 */
export interface ImageModerationOptions {
	filePath?: string;
	fileUrl?: string;
	dataId?: string;
	bizType?: string;
	type?: string;
	interval?: number;
	maxFrames?: number;
}

/**
 * 腾讯云文本内容安全客户端
 */
export class TencentTextModerationClient {
	private client: TextModerationServiceClient;

	constructor(config: TencentCloudConfig) {
		const clientConfig: ClientConfig = {
			credential: {
				secretId: config.secretId,
				secretKey: config.secretKey,
			},
			region: config.region || "ap-shanghai",
			profile: {
				httpProfile: {
					endpoint: "tms.tencentcloudapi.com",
				},
			},
		};

		this.client = new TextModerationServiceClient(clientConfig);
	}

	/**
	 * 检测文本内容
	 * @param content 要检测的文本内容
	 * @param bizType 业务类型，用于调用用户配置的审核策略
	 * @returns 检测结果
	 */
	async moderateText(
		content: string,
		bizType?: string,
	): Promise<TextModerationResult> {
		// 将文本内容转换为base64编码
		const base64Content = Buffer.from(content, "utf8").toString("base64");

		const params: TextModerationRequest = {
			Content: base64Content,
			BizType: bizType,
		};

		try {
			const response: TextModerationResponse =
				await this.client.TextModeration(params);

			if (!response.Suggestion) {
				throw new Error("Invalid response from Tencent Cloud TMS API");
			}

			return {
				suggestion: response.Suggestion as "Pass" | "Block" | "Review",
				label: response.Label || "",
				score: response.Score || 0,
				keywords: response.Keywords || [],
				subLabel: response.SubLabel || "",
			};
		} catch (error) {
			console.error("Tencent Cloud text moderation error:", error);
			throw new Error(`Text moderation failed: ${error}`);
		}
	}

	/**
	 * 批量检测文本内容
	 * @param contents 要检测的文本内容数组
	 * @param bizType 业务类型
	 * @returns 检测结果数组
	 */
	async moderateTexts(
		contents: string[],
		bizType?: string,
	): Promise<TextModerationResult[]> {
		const promises = contents.map((content) =>
			this.moderateText(content, bizType),
		);
		return Promise.all(promises);
	}

	/**
	 * 判断文本是否安全
	 * @param content 要检测的文本内容
	 * @param bizType 业务类型
	 * @returns true 表示安全，false 表示不安全
	 */
	async isTextSafe(content: string, bizType?: string): Promise<boolean> {
		const result = await this.moderateText(content, bizType);
		return result.suggestion === "Pass";
	}
}

/**
 * 创建腾讯云文本内容安全客户端实例
 * @param config 配置信息
 * @returns 客户端实例
 */
export function createTencentTextModerationClient(
	config: TencentCloudConfig,
): TencentTextModerationClient {
	return new TencentTextModerationClient(config);
}

/**
 * 从环境变量创建客户端
 * @param region 地区，默认为 ap-shanghai
 * @returns 客户端实例
 */
export function createTencentTextModerationClientFromEnv(
	region?: string,
): TencentTextModerationClient {
	const secretId = process.env.TENCENT_CLOUD_SECRET_ID;
	const secretKey = process.env.TENCENT_CLOUD_SECRET_KEY;

	if (!secretId || !secretKey) {
		throw new Error(
			"TENCENT_CLOUD_SECRET_ID and TENCENT_CLOUD_SECRET_KEY environment variables are required",
		);
	}

	return new TencentTextModerationClient({
		secretId,
		secretKey,
		region: region || process.env.TENCENT_CLOUD_REGION || "ap-shanghai",
	});
}

/**
 * 腾讯云图片内容安全客户端
 */
export class TencentImageModerationClient {
	private client: ImageModerationServiceClient;

	constructor(config: TencentCloudConfig) {
		const clientConfig: ClientConfig = {
			credential: {
				secretId: config.secretId,
				secretKey: config.secretKey,
			},
			region: config.region || "ap-shanghai",
			profile: {
				httpProfile: {
					endpoint: "ims.tencentcloudapi.com",
				},
			},
		};

		this.client = new ImageModerationServiceClient(clientConfig);
	}

	/**
	 * 检测图片内容
	 */
	async moderateImage(
		options: ImageModerationOptions,
	): Promise<ImageModerationResult> {
		const {
			filePath,
			fileUrl,
			bizType,
			dataId,
			type,
			interval,
			maxFrames,
		} = options;

		if (!filePath && !fileUrl) {
			throw new Error("Either filePath or fileUrl must be provided");
		}

		const params: ImageModerationRequest = {
			BizType: bizType,
			DataId: dataId,
			Type: type,
			Interval: interval,
			MaxFrames: maxFrames,
		};

		try {
			if (filePath) {
				const fileBuffer = await readFile(filePath);
				params.FileContent = fileBuffer.toString("base64");
			} else if (fileUrl) {
				params.FileUrl = fileUrl;
			}

			const response: ImageModerationResponse =
				await this.client.ImageModeration(params);

			if (!response.Suggestion) {
				throw new Error("Invalid response from Tencent Cloud IMS API");
			}

			return {
				suggestion: response.Suggestion as "Pass" | "Block" | "Review",
				label: response.Label || "Normal",
				subLabel: response.SubLabel || "",
				score: response.Score ?? 0,
				dataId: response.DataId,
				bizType: response.BizType,
				extra: response.Extra ?? null,
				fileMD5: response.FileMD5,
				labelResults: response.LabelResults ?? [],
				objectResults: response.ObjectResults ?? [],
				ocrResults: response.OcrResults ?? [],
				libResults: response.LibResults ?? [],
				recognitionResults: response.RecognitionResults ?? [],
			};
		} catch (error) {
			console.error("Tencent Cloud image moderation error:", error);
			throw new Error(`Image moderation failed: ${error}`);
		}
	}

	/**
	 * 判断图片是否安全
	 */
	async isImageSafe(options: ImageModerationOptions): Promise<boolean> {
		const result = await this.moderateImage(options);
		return result.suggestion === "Pass";
	}
}

/**
 * 创建腾讯云图片内容安全客户端实例
 * @param config 配置信息
 */
export function createTencentImageModerationClient(
	config: TencentCloudConfig,
): TencentImageModerationClient {
	return new TencentImageModerationClient(config);
}

/**
 * 从环境变量创建图片内容安全客户端
 */
export function createTencentImageModerationClientFromEnv(
	region?: string,
): TencentImageModerationClient {
	const secretId = process.env.TENCENT_CLOUD_SECRET_ID;
	const secretKey = process.env.TENCENT_CLOUD_SECRET_KEY;

	if (!secretId || !secretKey) {
		throw new Error(
			"TENCENT_CLOUD_SECRET_ID and TENCENT_CLOUD_SECRET_KEY environment variables are required",
		);
	}

	return new TencentImageModerationClient({
		secretId,
		secretKey,
		region: region || process.env.TENCENT_CLOUD_REGION || "ap-shanghai",
	});
}
