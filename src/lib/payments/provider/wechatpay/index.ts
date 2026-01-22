import {
	createDecipheriv,
	createPrivateKey,
	createSign,
	createVerify,
	randomBytes,
} from "node:crypto";
import fs from "node:fs";
import { logger } from "@/lib/logs";
import type {
	CreateCheckoutLink,
	CreateCustomerPortalLink,
	WebhookHandler,
} from "../../types";
import {
	markEventOrderPaid,
	markEventOrderRefunded,
} from "@/lib/events/event-orders";
import { db } from "@/lib/database/prisma/client";
import { sendEventRegistrationConfirmation } from "@/lib/mail/events";
import { getBaseUrl } from "@/lib/utils";

const WECHAT_BASE_URL = "https://api.mch.weixin.qq.com";

const resolveConfig = () => {
	const mchId = process.env.WECHAT_PAY_MCH_ID;
	const serialNo =
		process.env.WECHAT_PAY_SERIAL_NO ||
		process.env.WECHAT_PAY_CERT_SERIAL_NO;
	const apiV3Key =
		process.env.WECHAT_PAY_API_KEY_V3 || process.env.WECHAT_PAY_API_V3_KEY;
	const notifyUrl = process.env.WECHAT_PAY_NOTIFY_URL;
	const appId =
		process.env.WECHAT_SERVICE_ACCOUNT_APP_ID ||
		process.env.WECHAT_PAY_APP_ID;

	if (!mchId || !serialNo || !apiV3Key) {
		throw new Error("WeChat Pay configuration is missing.");
	}

	return { mchId, serialNo, apiV3Key, notifyUrl, appId };
};

const normalizePrivateKey = (value: string) =>
	value.replace(/\\n/g, "\n").trim();

const isPemPrivateKey = (value: string) =>
	/-----BEGIN (RSA )?PRIVATE KEY-----/.test(value) &&
	/-----END (RSA )?PRIVATE KEY-----/.test(value);

const validatePrivateKey = (value: string) => {
	if (!isPemPrivateKey(value)) {
		throw new Error(
			"WECHAT_PAY_PRIVATE_KEY must be a valid PEM-encoded private key.",
		);
	}
	try {
		createPrivateKey(value);
	} catch {
		throw new Error("WECHAT_PAY_PRIVATE_KEY format is invalid.");
	}
	return value;
};

const resolvePrivateKey = () => {
	const rawKey = process.env.WECHAT_PAY_PRIVATE_KEY;
	if (!rawKey) {
		throw new Error("WECHAT_PAY_PRIVATE_KEY is not configured.");
	}

	if (!rawKey.includes("BEGIN") && fs.existsSync(rawKey)) {
		const fileKey = fs.readFileSync(rawKey, "utf8");
		return validatePrivateKey(normalizePrivateKey(fileKey));
	}

	const normalizedKey = normalizePrivateKey(rawKey);
	return validatePrivateKey(normalizedKey);
};

const buildAuthorizationHeader = (params: {
	method: string;
	url: string;
	body?: string;
}) => {
	const { mchId, serialNo } = resolveConfig();
	const timestamp = Math.floor(Date.now() / 1000).toString();
	const nonceStr = randomBytes(16).toString("hex");
	const body = params.body ?? "";
	const url = new URL(params.url);
	const message = `${params.method}\n${url.pathname}${url.search}\n${timestamp}\n${nonceStr}\n${body}\n`;

	const signature = createSign("RSA-SHA256")
		.update(message)
		.sign(resolvePrivateKey(), "base64");

	return {
		authorization: `WECHATPAY2-SHA256-RSA2048 mchid=\"${mchId}\",nonce_str=\"${nonceStr}\",timestamp=\"${timestamp}\",serial_no=\"${serialNo}\",signature=\"${signature}\"`,
		timestamp,
		nonceStr,
	};
};

const wechatRequest = async <T>(params: {
	method: "GET" | "POST";
	path: string;
	body?: Record<string, any>;
}): Promise<T> => {
	const url = `${WECHAT_BASE_URL}${params.path}`;
	const bodyString = params.body ? JSON.stringify(params.body) : "";
	const { authorization } = buildAuthorizationHeader({
		method: params.method,
		url,
		body: bodyString,
	});

	const response = await fetch(url, {
		method: params.method,
		headers: {
			Authorization: authorization,
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: bodyString || undefined,
	});

	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(`WeChat Pay request failed: ${errorBody}`);
	}

	return (await response.json()) as T;
};

const decryptWechatResource = (resource: {
	ciphertext: string;
	nonce: string;
	associated_data?: string;
}) => {
	const { apiV3Key } = resolveConfig();
	const key = Buffer.from(apiV3Key, "utf8");
	if (key.length !== 32) {
		throw new Error("WECHAT_PAY_API_KEY_V3 must be 32 bytes.");
	}
	const nonce = Buffer.from(resource.nonce, "utf8");
	const cipherText = Buffer.from(resource.ciphertext, "base64");
	const authTag = cipherText.subarray(cipherText.length - 16);
	const data = cipherText.subarray(0, cipherText.length - 16);
	const decryptor = createDecipheriv("aes-256-gcm", key, nonce);
	if (resource.associated_data) {
		decryptor.setAAD(Buffer.from(resource.associated_data, "utf8"));
	}
	decryptor.setAuthTag(authTag);

	const decrypted = Buffer.concat([
		decryptor.update(data),
		decryptor.final(),
	]);

	return decrypted.toString("utf8");
};

const PLATFORM_CERT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let platformCertificates: {
	certs: Map<string, string>;
	expiresAt: number;
} | null = null;

const loadPlatformCertificates = async (forceRefresh = false) => {
	const now = Date.now();
	if (
		!forceRefresh &&
		platformCertificates &&
		platformCertificates.expiresAt > now
	) {
		return platformCertificates.certs;
	}

	const response = await wechatRequest<{ data: any[] }>({
		method: "GET",
		path: "/v3/certificates",
	});

	const certMap = new Map<string, string>();

	for (const cert of response.data) {
		const certificate = decryptWechatResource(cert.encrypt_certificate);
		certMap.set(cert.serial_no, certificate);
	}

	platformCertificates = {
		certs: certMap,
		expiresAt: now + PLATFORM_CERT_CACHE_TTL_MS,
	};
	return platformCertificates.certs;
};

const verifyWechatSignature = async (params: {
	timestamp: string;
	nonce: string;
	signature: string;
	serial: string;
	body: string;
}) => {
	let certs = await loadPlatformCertificates();
	let certificate = certs.get(params.serial);
	if (!certificate) {
		certs = await loadPlatformCertificates(true);
		certificate = certs.get(params.serial);
		if (!certificate) {
			return false;
		}
	}

	const message = `${params.timestamp}\n${params.nonce}\n${params.body}\n`;
	const verifier = createVerify("RSA-SHA256");
	verifier.update(message);
	verifier.end();
	return verifier.verify(certificate, params.signature, "base64");
};

export const createWechatNativeOrder = async (params: {
	outTradeNo: string;
	description: string;
	amount: number;
}) => {
	const { mchId, notifyUrl, appId } = resolveConfig();
	if (!notifyUrl || !appId) {
		throw new Error("WeChat Pay notify URL or App ID is missing.");
	}
	const body = {
		mchid: mchId,
		out_trade_no: params.outTradeNo,
		appid: appId,
		description: params.description,
		notify_url: notifyUrl,
		amount: {
			total: params.amount,
			currency: "CNY",
		},
	};

	const response = await wechatRequest<{
		prepay_id: string;
		code_url: string;
	}>({
		method: "POST",
		path: "/v3/pay/transactions/native",
		body,
	});

	return {
		prepayId: response.prepay_id,
		codeUrl: response.code_url,
	};
};

const buildJsapiParams = (params: { prepayId: string }) => {
	const { appId } = resolveConfig();
	if (!appId) {
		throw new Error("WeChat Pay App ID is missing.");
	}

	const timeStamp = Math.floor(Date.now() / 1000).toString();
	const nonceStr = randomBytes(16).toString("hex");
	const pkg = `prepay_id=${params.prepayId}`;
	const message = `${appId}\n${timeStamp}\n${nonceStr}\n${pkg}\n`;

	const paySign = createSign("RSA-SHA256")
		.update(message)
		.sign(resolvePrivateKey(), "base64");

	return {
		appId,
		timeStamp,
		nonceStr,
		package: pkg,
		signType: "RSA",
		paySign,
	};
};

export const createWechatJsapiOrder = async (params: {
	outTradeNo: string;
	description: string;
	amount: number;
	payerOpenId: string;
}) => {
	const { mchId, notifyUrl, appId } = resolveConfig();
	if (!notifyUrl || !appId) {
		throw new Error("WeChat Pay notify URL or App ID is missing.");
	}

	const body = {
		mchid: mchId,
		out_trade_no: params.outTradeNo,
		appid: appId,
		description: params.description,
		notify_url: notifyUrl,
		amount: {
			total: params.amount,
			currency: "CNY",
		},
		payer: {
			openid: params.payerOpenId,
		},
	};

	const response = await wechatRequest<{ prepay_id: string }>({
		method: "POST",
		path: "/v3/pay/transactions/jsapi",
		body,
	});

	return {
		prepayId: response.prepay_id,
		jsapiParams: buildJsapiParams({ prepayId: response.prepay_id }),
	};
};

export const requestWechatRefund = async (params: {
	outTradeNo: string;
	refundAmount: number;
	totalAmount: number;
	reason: string;
}) => {
	const { mchId } = resolveConfig();
	const refundNo = `RF${Date.now()}${randomBytes(6).toString("hex")}`;

	const body = {
		mchid: mchId,
		out_trade_no: params.outTradeNo,
		out_refund_no: refundNo,
		reason: params.reason,
		amount: {
			refund: params.refundAmount,
			total: params.totalAmount,
			currency: "CNY",
		},
	};

	const response = await wechatRequest<{ refund_id: string }>({
		method: "POST",
		path: "/v3/refund/domestic/refunds",
		body,
	});

	return {
		refundId: response.refund_id || refundNo,
		refundNo,
	};
};

export const createCheckoutLink: CreateCheckoutLink = async () => {
	logger.warn("WeChat Pay checkout links are not configured for this flow.");
	return null;
};

export const createCustomerPortalLink: CreateCustomerPortalLink = async () => {
	logger.warn("WeChat Pay customer portal is unavailable.");
	return null;
};

export const webhookHandler: WebhookHandler = async (req) => {
	try {
		const body = await req.text();
		const signature = req.headers.get("wechatpay-signature") || "";
		const timestamp = req.headers.get("wechatpay-timestamp") || "";
		const nonce = req.headers.get("wechatpay-nonce") || "";
		const serial = req.headers.get("wechatpay-serial") || "";

		if (!signature || !timestamp || !nonce || !serial) {
			logger.warn("WeChat Pay webhook missing signature headers.", {
				hasSignature: !!signature,
				hasTimestamp: !!timestamp,
				hasNonce: !!nonce,
				hasSerial: !!serial,
			});
			return new Response(
				JSON.stringify({ code: "FAIL", message: "invalid signature" }),
				{ status: 401 },
			);
		}

		const isValid = await verifyWechatSignature({
			body,
			signature,
			timestamp,
			nonce,
			serial,
		});

		if (!isValid) {
			logger.warn("WeChat Pay webhook signature invalid.", {
				serial,
				timestamp,
			});
			return new Response(
				JSON.stringify({ code: "FAIL", message: "invalid signature" }),
				{ status: 401 },
			);
		}

		const payload = JSON.parse(body);
		const resource = payload.resource;
		if (!resource) {
			return new Response(
				JSON.stringify({ code: "SUCCESS", message: "OK" }),
				{ status: 200 },
			);
		}

		const decrypted = JSON.parse(decryptWechatResource(resource));
		const eventType = payload.event_type;

		if (eventType === "TRANSACTION.SUCCESS") {
			const orderNo = decrypted.out_trade_no;
			const transactionId = decrypted.transaction_id;
			const amountTotal = decrypted.amount?.total;
			const currency = decrypted.amount?.currency;

			const order = await db.eventOrder.findUnique({
				where: { orderNo },
				include: {
					event: {
						select: {
							id: true,
							title: true,
							startTime: true,
							address: true,
						},
					},
					user: { select: { name: true, email: true } },
				},
			});

			if (!order) {
				return new Response(
					JSON.stringify({ code: "SUCCESS", message: "OK" }),
					{ status: 200 },
				);
			}

			if (currency && currency !== order.currency) {
				return new Response(
					JSON.stringify({
						code: "FAIL",
						message: "currency mismatch",
					}),
					{ status: 400 },
				);
			}

			const expectedAmount = Math.round(order.totalAmount * 100);
			if (amountTotal !== expectedAmount) {
				return new Response(
					JSON.stringify({
						code: "FAIL",
						message: "amount mismatch",
					}),
					{ status: 400 },
				);
			}

			const updated = await markEventOrderPaid({
				orderNo,
				transactionId,
				paidAt: new Date(decrypted.success_time || Date.now()),
			});

			if (updated && "order" in updated) {
				await sendEventRegistrationConfirmation({
					eventTitle: order.event.title,
					eventDate: order.event.startTime.toISOString(),
					eventLocation: order.event.address || "线上活动",
					eventUrl: `${getBaseUrl()}/events/${order.event.id}`,
					userName: order.user.name || "",
					userEmail: order.user.email,
				});
			}
		}

		if (eventType === "REFUND.SUCCESS") {
			await markEventOrderRefunded({
				orderNo: decrypted.out_trade_no,
				refundId: decrypted.refund_id,
				refundedAt: new Date(decrypted.success_time || Date.now()),
			});
		}

		return new Response(
			JSON.stringify({ code: "SUCCESS", message: "OK" }),
			{ status: 200 },
		);
	} catch (error) {
		logger.error("WeChat Pay webhook error", error);
		return new Response(
			JSON.stringify({ code: "FAIL", message: "internal error" }),
			{ status: 500 },
		);
	}
};
