import { db } from "@community/lib-server/database/prisma/client";
import { logger } from "@community/lib-server/logs";
import {
	buildWechatJsapiParams,
	createWechatJsapiOrder,
	createWechatNativeOrder,
} from "@community/lib-server/payments/provider/wechatpay";
import {
	WECHAT_MINI_PROGRAM_MIN_BRIDGE_VERSION,
	WECHAT_PAYMENT_CHANNELS,
	WECHAT_PAYMENT_ERROR_CODES,
	isWechatChannel,
	resolveWechatPaymentChannel,
	type WechatMiniProgramRequestPaymentParams,
	type WechatPaymentChannel,
	type WechatPaymentClientContext,
	type WechatPayPayload,
} from "@community/lib-shared/payments/wechat-payment";
import type { PaymentMethod } from "@prisma/client";

export interface WechatPreparedOrderResponse {
	orderId: string;
	orderNo: string;
	totalAmount: number;
	expiredAt: string;
	quantity: number;
	channel: WechatPaymentChannel;
	payPayload: WechatPayPayload;
	codeUrl?: string;
	jsapiParams?: ReturnType<typeof buildWechatJsapiParams>;
	isExisting?: boolean;
}

export type WechatPrepareHttpStatus = 200 | 400 | 404 | 500;

export interface WechatPrepareResult {
	success: boolean;
	status: WechatPrepareHttpStatus;
	data?: WechatPreparedOrderResponse;
	error?: string;
	code?: string;
	requiresUpgrade?: boolean;
	minBridgeVersion?: string;
}

interface PrepareEventTicketWechatPaymentParams {
	orderId: string;
	userId: string;
	userAgent?: string | null;
	clientContext?: WechatPaymentClientContext;
	isExisting?: boolean;
}

const mapChannelToPaymentMethod = (
	channel: WechatPaymentChannel,
): PaymentMethod =>
	channel === WECHAT_PAYMENT_CHANNELS.WECHAT_NATIVE
		? "WECHAT_NATIVE"
		: "WECHAT_JSAPI";

const buildPayload = (params: {
	channel: WechatPaymentChannel;
	orderNo: string;
	codeUrl: string | null;
	prepayId: string | null;
}):
	| {
			success: true;
			payPayload: WechatPayPayload;
			codeUrl?: string;
			jsapiParams?: ReturnType<typeof buildWechatJsapiParams>;
	  }
	| {
			success: false;
			error: string;
	  } => {
	if (params.channel === WECHAT_PAYMENT_CHANNELS.WECHAT_NATIVE) {
		if (!params.codeUrl) {
			return {
				success: false,
				error: "未获取到微信扫码支付二维码，请取消订单后重试",
			};
		}

		return {
			success: true,
			payPayload: {
				codeUrl: params.codeUrl,
			},
			codeUrl: params.codeUrl,
		};
	}

	if (!params.prepayId) {
		return {
			success: false,
			error: "未获取到微信预支付参数，请稍后重试",
		};
	}

	const jsapiParams = buildWechatJsapiParams(params.prepayId);

	if (params.channel === WECHAT_PAYMENT_CHANNELS.MINIPROGRAM_BRIDGE) {
		const requestPaymentParams: WechatMiniProgramRequestPaymentParams = {
			...jsapiParams,
			orderNo: params.orderNo,
		};
		return {
			success: true,
			payPayload: {
				requestPaymentParams,
			},
			jsapiParams,
		};
	}

	return {
		success: true,
		payPayload: {
			jsapiParams,
		},
		jsapiParams,
	};
};

const shouldCreatePaymentInstruction = (params: {
	channel: WechatPaymentChannel;
	codeUrl: string | null;
	prepayId: string | null;
}) => {
	if (params.channel === WECHAT_PAYMENT_CHANNELS.WECHAT_NATIVE) {
		return !params.codeUrl;
	}

	return !params.prepayId;
};

export const prepareEventTicketWechatPayment = async (
	params: PrepareEventTicketWechatPaymentParams,
): Promise<WechatPrepareResult> => {
	const order = await db.eventOrder.findFirst({
		where: {
			id: params.orderId,
			userId: params.userId,
			status: "PENDING",
		},
		select: {
			id: true,
			orderNo: true,
			totalAmount: true,
			currency: true,
			expiredAt: true,
			quantity: true,
			paymentMethod: true,
			prepayId: true,
			codeUrl: true,
			event: {
				select: {
					title: true,
				},
			},
			user: {
				select: {
					wechatOpenId: true,
				},
			},
		},
	});

	if (!order) {
		return {
			success: false,
			status: 404,
			error: "订单不存在",
		};
	}

	const channelResult = resolveWechatPaymentChannel({
		userAgent: params.userAgent,
		clientContext: params.clientContext,
		minBridgeVersion: WECHAT_MINI_PROGRAM_MIN_BRIDGE_VERSION,
	});

	if (!channelResult.ok) {
		return {
			success: false,
			status: 400,
			error: "当前小程序版本不支持支付，请升级后重试",
			code: channelResult.errorCode,
			requiresUpgrade: channelResult.requiresUpgrade,
			minBridgeVersion: channelResult.minBridgeVersion,
		};
	}

	const channel = channelResult.channel;
	if (isWechatChannel(channel) && !order.user.wechatOpenId) {
		return {
			success: false,
			status: 400,
			error: "未绑定微信 OpenID，无法使用 JSAPI 支付",
			code: WECHAT_PAYMENT_ERROR_CODES.WECHAT_OPENID_REQUIRED,
		};
	}

	logger.info("Preparing WeChat payment channel", {
		orderId: order.id,
		orderNo: order.orderNo,
		channel,
		environmentType: channelResult.environmentType,
		shellVersion: params.clientContext?.shellVersion,
		bridgeVersion: params.clientContext?.miniProgramBridgeVersion,
		bridgeSupported: params.clientContext?.miniProgramBridgeSupported,
	});

	let prepayId = order.prepayId;
	let codeUrl = order.codeUrl;
	let paymentMethod = order.paymentMethod;

	const expectedPaymentMethod = mapChannelToPaymentMethod(channel);
	if (shouldCreatePaymentInstruction({ channel, codeUrl, prepayId })) {
		const amountInCents = Math.round(order.totalAmount * 100);
		const description = `${order.event.title} 门票`;
		const paymentResult =
			channel === WECHAT_PAYMENT_CHANNELS.WECHAT_NATIVE
				? await createWechatNativeOrder({
						outTradeNo: order.orderNo,
						description,
						amount: amountInCents,
					})
				: await createWechatJsapiOrder({
						outTradeNo: order.orderNo,
						description,
						amount: amountInCents,
						payerOpenId: order.user.wechatOpenId!,
					});

		if (!paymentResult) {
			return {
				success: false,
				status: 500,
				error: "微信支付订单创建失败",
			};
		}

		prepayId = paymentResult.prepayId;
		codeUrl = "codeUrl" in paymentResult ? paymentResult.codeUrl : null;
		paymentMethod = expectedPaymentMethod;

		await db.eventOrder.update({
			where: { id: order.id },
			data: {
				prepayId,
				codeUrl,
				paymentMethod,
			},
		});
	} else if (!paymentMethod) {
		paymentMethod = expectedPaymentMethod;
		await db.eventOrder.update({
			where: { id: order.id },
			data: {
				paymentMethod,
			},
		});
	}

	const payloadResult = buildPayload({
		channel,
		orderNo: order.orderNo,
		codeUrl,
		prepayId,
	});

	if (!payloadResult.success) {
		return {
			success: false,
			status: 500,
			error: payloadResult.error,
		};
	}

	return {
		success: true,
		status: 200,
		data: {
			orderId: order.id,
			orderNo: order.orderNo,
			totalAmount: order.totalAmount,
			expiredAt: order.expiredAt.toISOString(),
			quantity: order.quantity,
			channel,
			payPayload: payloadResult.payPayload,
			codeUrl: payloadResult.codeUrl,
			jsapiParams: payloadResult.jsapiParams,
			...(params.isExisting ? { isExisting: true } : {}),
		},
	};
};

export const parseWechatClientContextFromQuery = (query: {
	environmentType?: string;
	miniProgramBridgeSupported?: string;
	miniProgramBridgeVersion?: string;
	shellVersion?: string;
}): WechatPaymentClientContext => {
	const toBoolean = (value?: string) => {
		if (value === "true") {
			return true;
		}
		if (value === "false") {
			return false;
		}
		return undefined;
	};

	const environmentType =
		query.environmentType === "miniprogram" ||
		query.environmentType === "wechat" ||
		query.environmentType === "none"
			? query.environmentType
			: undefined;

	return {
		environmentType,
		miniProgramBridgeSupported: toBoolean(query.miniProgramBridgeSupported),
		miniProgramBridgeVersion: query.miniProgramBridgeVersion,
		shellVersion: query.shellVersion,
	};
};
