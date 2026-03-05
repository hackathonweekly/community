export const WECHAT_MINI_PROGRAM_MIN_BRIDGE_VERSION = "1.2.0";

export const WECHAT_PAYMENT_CHANNELS = {
	MINIPROGRAM_BRIDGE: "MINIPROGRAM_BRIDGE",
	WECHAT_JSAPI: "WECHAT_JSAPI",
	WECHAT_NATIVE: "WECHAT_NATIVE",
} as const;

export type WechatPaymentChannel =
	(typeof WECHAT_PAYMENT_CHANNELS)[keyof typeof WECHAT_PAYMENT_CHANNELS];

export const WECHAT_BRIDGE_ERROR_CODES = {
	BRIDGE_NOT_SUPPORTED: "BRIDGE_NOT_SUPPORTED",
	PAY_CANCELLED: "PAY_CANCELLED",
	PAY_FAILED: "PAY_FAILED",
	BRIDGE_TIMEOUT: "BRIDGE_TIMEOUT",
	INVALID_PAYLOAD: "INVALID_PAYLOAD",
} as const;

export type WechatBridgeErrorCode =
	(typeof WECHAT_BRIDGE_ERROR_CODES)[keyof typeof WECHAT_BRIDGE_ERROR_CODES];

export class WechatBridgeError extends Error {
	constructor(
		public readonly code: WechatBridgeErrorCode,
		message?: string,
	) {
		super(message ?? code);
		this.name = "WechatBridgeError";
	}
}

export const WECHAT_PAYMENT_ERROR_CODES = {
	MINI_PROGRAM_BRIDGE_REQUIRED: "MINI_PROGRAM_BRIDGE_REQUIRED",
	MINI_PROGRAM_PAY_FAILED: "MINI_PROGRAM_PAY_FAILED",
	MINI_PROGRAM_PAY_CANCELLED: "MINI_PROGRAM_PAY_CANCELLED",
	MINI_PROGRAM_BRIDGE_TIMEOUT: "MINI_PROGRAM_BRIDGE_TIMEOUT",
	WECHAT_OPENID_REQUIRED: "WECHAT_OPENID_REQUIRED",
} as const;

export type WechatPaymentErrorCode =
	(typeof WECHAT_PAYMENT_ERROR_CODES)[keyof typeof WECHAT_PAYMENT_ERROR_CODES];

export type WechatEnvironmentType = "miniprogram" | "wechat" | "none";

export interface WechatPaymentClientContext {
	environmentType?: WechatEnvironmentType;
	miniProgramBridgeSupported?: boolean;
	miniProgramBridgeVersion?: string;
	shellVersion?: string;
}

export interface WechatJsapiParams {
	appId: string;
	timeStamp: string;
	nonceStr: string;
	package: string;
	signType: string;
	paySign: string;
}

export interface WechatMiniProgramRequestPaymentParams
	extends WechatJsapiParams {
	orderNo: string;
}

export interface WechatNativePayPayload {
	codeUrl: string;
}

export interface WechatJsapiPayPayload {
	jsapiParams: WechatJsapiParams;
}

export interface WechatMiniProgramPayPayload {
	requestPaymentParams: WechatMiniProgramRequestPaymentParams;
}

export type WechatPayPayload =
	| WechatNativePayPayload
	| WechatJsapiPayPayload
	| WechatMiniProgramPayPayload;

export interface WechatChannelSelection {
	ok: true;
	channel: WechatPaymentChannel;
	environmentType: WechatEnvironmentType;
}

export interface WechatChannelSelectionError {
	ok: false;
	errorCode: WechatPaymentErrorCode;
	environmentType: WechatEnvironmentType;
	requiresUpgrade?: boolean;
	minBridgeVersion?: string;
}

const inferEnvironmentFromUserAgent = (
	userAgent?: string | null,
): WechatEnvironmentType => {
	if (!userAgent) {
		return "none";
	}

	const lowerUserAgent = userAgent.toLowerCase();
	const isWeChat = lowerUserAgent.includes("micromessenger");
	if (!isWeChat) {
		return "none";
	}

	if (lowerUserAgent.includes("miniprogram")) {
		return "miniprogram";
	}

	return "wechat";
};

const compareSemver = (left: string, right: string): number => {
	const leftParts = left
		.split(".")
		.map((part) => Number.parseInt(part, 10))
		.map((part) => (Number.isNaN(part) ? 0 : part));
	const rightParts = right
		.split(".")
		.map((part) => Number.parseInt(part, 10))
		.map((part) => (Number.isNaN(part) ? 0 : part));
	const maxLength = Math.max(leftParts.length, rightParts.length);

	for (let index = 0; index < maxLength; index += 1) {
		const leftValue = leftParts[index] ?? 0;
		const rightValue = rightParts[index] ?? 0;
		if (leftValue > rightValue) {
			return 1;
		}
		if (leftValue < rightValue) {
			return -1;
		}
	}

	return 0;
};

export const resolveWechatPaymentChannel = (params: {
	userAgent?: string | null;
	clientContext?: WechatPaymentClientContext;
	minBridgeVersion?: string;
}): WechatChannelSelection | WechatChannelSelectionError => {
	const minBridgeVersion =
		params.minBridgeVersion ?? WECHAT_MINI_PROGRAM_MIN_BRIDGE_VERSION;
	const environmentType =
		params.clientContext?.environmentType ||
		inferEnvironmentFromUserAgent(params.userAgent);

	if (environmentType === "miniprogram") {
		const bridgeSupported =
			params.clientContext?.miniProgramBridgeSupported === true;
		const bridgeVersion =
			params.clientContext?.miniProgramBridgeVersion ?? "0.0.0";
		if (
			!bridgeSupported ||
			compareSemver(bridgeVersion, minBridgeVersion) < 0
		) {
			return {
				ok: false,
				errorCode:
					WECHAT_PAYMENT_ERROR_CODES.MINI_PROGRAM_BRIDGE_REQUIRED,
				environmentType,
				requiresUpgrade: true,
				minBridgeVersion,
			};
		}

		return {
			ok: true,
			channel: WECHAT_PAYMENT_CHANNELS.MINIPROGRAM_BRIDGE,
			environmentType,
		};
	}

	if (environmentType === "wechat") {
		return {
			ok: true,
			channel: WECHAT_PAYMENT_CHANNELS.WECHAT_JSAPI,
			environmentType,
		};
	}

	return {
		ok: true,
		channel: WECHAT_PAYMENT_CHANNELS.WECHAT_NATIVE,
		environmentType,
	};
};

export const isWechatChannel = (channel: WechatPaymentChannel) =>
	channel === WECHAT_PAYMENT_CHANNELS.WECHAT_JSAPI ||
	channel === WECHAT_PAYMENT_CHANNELS.MINIPROGRAM_BRIDGE;
