"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@community/ui/ui/dialog";
import { Button } from "@community/ui/ui/button";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { EventRegistration } from "./types";
import {
	CheckCircleIcon,
	ExclamationTriangleIcon,
	QrCodeIcon,
	XCircleIcon,
} from "@heroicons/react/24/outline";
import { Loader2 } from "lucide-react";
import { cn } from "@community/lib-shared/utils";
import {
	WECHAT_PAYMENT_CHANNELS,
	WECHAT_BRIDGE_ERROR_CODES,
	WechatBridgeError,
	type WechatMiniProgramRequestPaymentParams,
	type WechatPayPayload,
	type WechatPaymentChannel,
} from "@community/lib-shared/payments/wechat-payment";

export interface PaymentOrderData {
	orderId: string;
	orderNo: string;
	expiredAt: string;
	totalAmount: number;
	quantity?: number;
	channel?: WechatPaymentChannel;
	payPayload?: WechatPayPayload;
	codeUrl?: string;
	isExisting?: boolean;
	jsapiParams?: {
		appId: string;
		timeStamp: string;
		nonceStr: string;
		package: string;
		signType: string;
		paySign: string;
	};
}

declare global {
	interface Window {
		WeixinJSBridge?: {
			invoke: (
				method: string,
				params: Record<string, any>,
				cb: (res: { err_msg: string }) => void,
			) => void;
		};
	}
}

interface InviteInfo {
	id: string;
	code: string;
	status: string;
	redeemedBy?: {
		id: string;
		name: string | null;
		email: string;
	};
}

interface PaymentModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	eventId: string;
	order: PaymentOrderData;
	onPaymentSuccess: (registration: EventRegistration) => void;
}

type PaymentPhase = "waiting" | "polling" | "success" | "failed" | "expired";

const invokeWechatPay = (params: PaymentOrderData["jsapiParams"]) => {
	return new Promise<void>((resolve, reject) => {
		if (!params) {
			reject(new Error("Missing JSAPI params"));
			return;
		}

		if (typeof window === "undefined") {
			reject(new Error("Window not available"));
			return;
		}

		const handler = () => {
			const bridge = window.WeixinJSBridge;
			if (!bridge) {
				reject(new Error("WeixinJSBridge not available"));
				return;
			}
			bridge.invoke("getBrandWCPayRequest", params, (res) => {
				if (res.err_msg === "get_brand_wcpay_request:ok") {
					resolve();
					return;
				}
				reject(new Error(res.err_msg));
			});
		};

		if (window.WeixinJSBridge) {
			handler();
			return;
		}

		document.addEventListener("WeixinJSBridgeReady", handler, false);
	});
};

const invokeMiniProgramBridgePay = async (
	params: WechatMiniProgramRequestPaymentParams,
) => {
	if (typeof window === "undefined") {
		throw new WechatBridgeError(
			WECHAT_BRIDGE_ERROR_CODES.BRIDGE_NOT_SUPPORTED,
			"Window not available",
		);
	}

	const requestPayment = window.__HWMiniAppBridge__?.requestPayment;
	if (!requestPayment) {
		throw new WechatBridgeError(
			WECHAT_BRIDGE_ERROR_CODES.BRIDGE_NOT_SUPPORTED,
		);
	}

	const result = await requestPayment(params);
	if (!result.ok) {
		const code =
			result.errCode === "PAY_CANCELLED"
				? WECHAT_BRIDGE_ERROR_CODES.PAY_CANCELLED
				: WECHAT_BRIDGE_ERROR_CODES.PAY_FAILED;
		throw new WechatBridgeError(code, result.errMsg);
	}
};

export function PaymentModal({
	open,
	onOpenChange,
	eventId,
	order,
	onPaymentSuccess,
}: PaymentModalProps) {
	const t = useTranslations("events.registration.payment");
	const [status, setStatus] = useState<string>("PENDING");
	const [invites, setInvites] = useState<InviteInfo[]>([]);
	const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
	const [pollingError, setPollingError] = useState<string | null>(null);
	const [isQuerying, setIsQuerying] = useState(false);
	const [invitesFetched, setInvitesFetched] = useState(false);
	const [jsapiInvoked, setJsapiInvoked] = useState(false);
	const successHandledRef = useRef(false);
	const jsapiInvokedRef = useRef(false);
	const invitesLoadedRef = useRef(false);
	const pollFailureCountRef = useRef(0);
	const pollErrorNotifiedRef = useRef(false);

	const expiresAt = useMemo(
		() => new Date(order.expiredAt),
		[order.expiredAt],
	);

	const resolvedChannel = useMemo(() => {
		if (order.channel) {
			return order.channel;
		}
		if (order.codeUrl) {
			return WECHAT_PAYMENT_CHANNELS.WECHAT_NATIVE;
		}
		if (order.jsapiParams) {
			return WECHAT_PAYMENT_CHANNELS.WECHAT_JSAPI;
		}
		return undefined;
	}, [order.channel, order.codeUrl, order.jsapiParams]);

	const resolvedCodeUrl = useMemo(() => {
		if (order.payPayload && "codeUrl" in order.payPayload) {
			return order.payPayload.codeUrl;
		}
		return order.codeUrl;
	}, [order.codeUrl, order.payPayload]);

	const resolvedJsapiParams = useMemo(() => {
		if (order.payPayload && "jsapiParams" in order.payPayload) {
			return order.payPayload.jsapiParams;
		}
		return order.jsapiParams;
	}, [order.jsapiParams, order.payPayload]);

	const miniProgramRequestPaymentParams = useMemo(() => {
		if (order.payPayload && "requestPaymentParams" in order.payPayload) {
			return order.payPayload.requestPaymentParams;
		}
		return undefined;
	}, [order.payPayload]);

	const paymentPhase = useMemo<PaymentPhase>(() => {
		if (status === "PAID") return "success";
		if (status === "CANCELLED") {
			return remainingSeconds <= 0 ? "expired" : "failed";
		}
		if (remainingSeconds <= 0) return "expired";
		if (isQuerying || jsapiInvoked) return "polling";
		return "waiting";
	}, [status, remainingSeconds, isQuerying, jsapiInvoked]);

	useEffect(() => {
		if (!open) return;
		setStatus("PENDING");
		setInvites([]);
		setPollingError(null);
		setIsQuerying(false);
		setInvitesFetched(false);
		setJsapiInvoked(false);
		successHandledRef.current = false;
		jsapiInvokedRef.current = false;
		invitesLoadedRef.current = false;
		pollFailureCountRef.current = 0;
		pollErrorNotifiedRef.current = false;
	}, [open, order.orderId]);

	useEffect(() => {
		if (!open) return;
		const initialDiff = Math.max(0, expiresAt.getTime() - Date.now());
		setRemainingSeconds(Math.floor(initialDiff / 1000));
		const interval = window.setInterval(() => {
			const diff = Math.max(0, expiresAt.getTime() - Date.now());
			setRemainingSeconds(Math.floor(diff / 1000));
		}, 1000);
		return () => window.clearInterval(interval);
	}, [open, expiresAt]);

	const handlePollFailure = () => {
		pollFailureCountRef.current += 1;
		setPollingError(t("statusFetchRetry"));
		if (pollFailureCountRef.current >= 3 && !pollErrorNotifiedRef.current) {
			pollErrorNotifiedRef.current = true;
			toast.error(t("statusFetchFailed"));
		}
	};

	const fetchOrderStatus = useCallback(async () => {
		try {
			const response = await fetch(
				`/api/events/${eventId}/orders/${order.orderId}`,
			);
			if (!response.ok) {
				handlePollFailure();
				return;
			}
			const result = await response.json();
			const data = result.data;
			if (!data) {
				handlePollFailure();
				return;
			}

			pollFailureCountRef.current = 0;
			pollErrorNotifiedRef.current = false;
			setPollingError(null);

			setStatus(data.status);

			if (data.status === "PAID" && !successHandledRef.current) {
				successHandledRef.current = true;
				if (data.registration) {
					onPaymentSuccess(data.registration);
				}
			}

			if (data.status === "PAID" && !invitesLoadedRef.current) {
				invitesLoadedRef.current = true;
				const invitesResponse = await fetch(
					`/api/events/${eventId}/orders/${order.orderId}/invites`,
				);
				if (invitesResponse.ok) {
					const inviteData = await invitesResponse.json();
					setInvites(inviteData.data || []);
				}
				setInvitesFetched(true);
			}
		} catch (error) {
			console.error("Failed to fetch order status", error);
			handlePollFailure();
		}
	}, [eventId, order.orderId, onPaymentSuccess]);

	const handleManualQuery = async () => {
		setIsQuerying(true);
		try {
			const response = await fetch(
				`/api/events/${eventId}/orders/${order.orderId}/query`,
				{ method: "POST" },
			);
			const result = await response.json();
			if (!response.ok) {
				throw new Error(result?.error || t("statusFetchFailed"));
			}

			if (result.data?.status === "PAID") {
				setStatus("PAID");
				toast.success(t("paidSuccess"));
				await fetchOrderStatus();
				return;
			}

			if (
				result.data?.wechatStatus === "CLOSED" ||
				result.data?.wechatStatus === "REVOKED"
			) {
				setStatus("CANCELLED");
				toast.error(t("orderClosed"));
				return;
			}

			if (result.data?.wechatStatus === "NOTPAY") {
				toast.info(t("paymentNotDetected"));
				return;
			}

			if (result.data?.wechatStatusDesc) {
				toast.info(result.data.wechatStatusDesc);
			}
		} catch (error) {
			console.error("Manual order query failed", error);
			toast.error(t("statusFetchFailed"));
		} finally {
			setIsQuerying(false);
		}
	};

	useEffect(() => {
		if (!open) return;
		fetchOrderStatus();
		const interval = window.setInterval(fetchOrderStatus, 3000);
		return () => window.clearInterval(interval);
	}, [open, fetchOrderStatus]);

	useEffect(() => {
		if (!open || jsapiInvokedRef.current) return;

		if (
			resolvedChannel === WECHAT_PAYMENT_CHANNELS.MINIPROGRAM_BRIDGE &&
			miniProgramRequestPaymentParams
		) {
			jsapiInvokedRef.current = true;
			setJsapiInvoked(true);
			invokeMiniProgramBridgePay(miniProgramRequestPaymentParams)
				.then(() => fetchOrderStatus())
				.catch((error) => {
					console.error("Mini Program bridge payment error", error);
					if (error instanceof WechatBridgeError) {
						if (
							error.code ===
							WECHAT_BRIDGE_ERROR_CODES.BRIDGE_NOT_SUPPORTED
						) {
							toast.error(t("miniProgramBridgeRequired"));
							return;
						}
						if (
							error.code ===
							WECHAT_BRIDGE_ERROR_CODES.PAY_CANCELLED
						) {
							toast.info(t("miniProgramPayCancelled"));
							return;
						}
					}
					toast.error(t("wechatPayIncomplete"));
				});
			return;
		}

		if (
			resolvedChannel === WECHAT_PAYMENT_CHANNELS.WECHAT_JSAPI &&
			resolvedJsapiParams
		) {
			jsapiInvokedRef.current = true;
			setJsapiInvoked(true);
			invokeWechatPay(resolvedJsapiParams)
				.then(() => fetchOrderStatus())
				.catch((error) => {
					console.error("WeChat JSAPI error", error);
					toast.error(t("wechatPayIncomplete"));
				});
		}
	}, [
		open,
		resolvedChannel,
		resolvedJsapiParams,
		miniProgramRequestPaymentParams,
		t,
		fetchOrderStatus,
	]);

	useEffect(() => {
		if (!open) return;
		if (status === "PENDING" && Date.now() >= expiresAt.getTime()) {
			fetch(`/api/events/${eventId}/orders/${order.orderId}/cancel`, {
				method: "POST",
			});
			setStatus("CANCELLED");
		}
	}, [remainingSeconds, status, open, eventId, order.orderId, expiresAt]);

	useEffect(() => {
		if (!open || status !== "PAID") return;
		if ((order.quantity ?? 1) > 1) return;
		if (!invitesFetched) return;
		const timeoutId = window.setTimeout(() => {
			onOpenChange(false);
		}, 3500);
		return () => window.clearTimeout(timeoutId);
	}, [open, status, order.quantity, invitesFetched, onOpenChange]);

	const handleCancel = async () => {
		await fetch(`/api/events/${eventId}/orders/${order.orderId}/cancel`, {
			method: "POST",
		});
		setStatus("CANCELLED");
		onOpenChange(false);
	};

	const formatCountdown = () => {
		const minutes = Math.floor(remainingSeconds / 60);
		const seconds = remainingSeconds % 60;
		return `${minutes}:${seconds.toString().padStart(2, "0")}`;
	};

	const origin = typeof window !== "undefined" ? window.location.origin : "";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div className="text-sm text-muted-foreground">
						{t("orderNumber")}：{order.orderNo}
					</div>
					<div className="text-sm">
						{t("amount")}：¥{order.totalAmount.toFixed(2)}
					</div>
					<div className="rounded-md border bg-muted/40 px-3 py-2">
						<div className="flex items-center justify-center gap-2 text-sm">
							{paymentPhase === "waiting" && (
								<>
									{resolvedChannel ===
									WECHAT_PAYMENT_CHANNELS.WECHAT_NATIVE ? (
										<QrCodeIcon className="w-5 h-5 text-blue-500" />
									) : (
										<Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
									)}
									<span className="text-muted-foreground">
										{resolvedChannel ===
										WECHAT_PAYMENT_CHANNELS.WECHAT_NATIVE
											? t("scanToPay")
											: resolvedChannel ===
													WECHAT_PAYMENT_CHANNELS.MINIPROGRAM_BRIDGE
												? t("invokingMiniProgram")
												: t("invoking")}
									</span>
								</>
							)}
							{paymentPhase === "polling" && (
								<>
									<Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
									<span className="text-blue-600">
										{t("polling")}
									</span>
								</>
							)}
							{paymentPhase === "success" && (
								<>
									<CheckCircleIcon className="w-5 h-5 text-green-500" />
									<span className="text-green-600 font-medium">
										{t("paidSuccess")}
									</span>
								</>
							)}
							{paymentPhase === "failed" && (
								<>
									<XCircleIcon className="w-5 h-5 text-red-500" />
									<span className="text-red-600">
										{t("orderCancelled")}
									</span>
								</>
							)}
							{paymentPhase === "expired" && (
								<>
									<ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
									<span className="text-red-600">
										{t("orderExpired")}
									</span>
								</>
							)}
						</div>
					</div>
					{status === "PENDING" &&
						resolvedChannel ===
							WECHAT_PAYMENT_CHANNELS.WECHAT_NATIVE &&
						resolvedCodeUrl && (
							<div className="flex flex-col items-center space-y-3">
								<QRCode value={resolvedCodeUrl} size={200} />
								<div className="text-sm text-muted-foreground">
									{t("scanToPay")}
								</div>
							</div>
						)}
					{status === "PENDING" &&
						resolvedChannel !==
							WECHAT_PAYMENT_CHANNELS.WECHAT_NATIVE &&
						(resolvedJsapiParams ||
							miniProgramRequestPaymentParams) && (
							<div className="text-sm text-muted-foreground">
								{resolvedChannel ===
								WECHAT_PAYMENT_CHANNELS.MINIPROGRAM_BRIDGE
									? t("invokingMiniProgram")
									: t("invoking")}
							</div>
						)}

					{status === "PENDING" && (
						<div
							className={cn(
								"flex items-center justify-between text-sm",
								remainingSeconds < 300 && "text-red-600",
							)}
						>
							<span>{t("remainingTime")}</span>
							<span className="font-medium">
								{formatCountdown()}
							</span>
						</div>
					)}

					{status === "PENDING" &&
						remainingSeconds < 300 &&
						remainingSeconds > 0 && (
							<div className="text-xs text-red-500">
								{t("expiringWarning")}
							</div>
						)}

					{status === "PENDING" && (
						<Button
							variant="outline"
							onClick={handleManualQuery}
							disabled={isQuerying}
						>
							{isQuerying ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									{t("querying")}
								</>
							) : (
								t("queryPayment")
							)}
						</Button>
					)}

					{pollingError && status === "PENDING" && (
						<div className="text-xs text-amber-600">
							{pollingError}
						</div>
					)}

					{invites.length > 0 && status === "PAID" && (
						<div className="space-y-2">
							<div className="text-sm font-medium">
								{t("giftLinks")}
							</div>
							{invites.map((invite) => {
								const url = `${origin}/events/${eventId}/register?gift=${invite.code}`;
								return (
									<div
										key={invite.id}
										className="flex items-center justify-between gap-2 text-xs"
									>
										<span className="truncate">{url}</span>
										<Button
											variant="outline"
											size="sm"
											onClick={() => {
												navigator.clipboard.writeText(
													url,
												);
												toast.success(
													t("inviteCopied"),
												);
											}}
										>
											{t("copyInvite")}
										</Button>
									</div>
								);
							})}
						</div>
					)}

					<div className="flex justify-end gap-2">
						{status === "PENDING" && (
							<Button variant="outline" onClick={handleCancel}>
								{order.isExisting
									? t("cancelOrderAndRetry")
									: t("cancelOrder")}
							</Button>
						)}
						<Button onClick={() => onOpenChange(false)}>
							{t("close")}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
