"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { EventRegistration } from "./types";

export interface PaymentOrderData {
	orderId: string;
	orderNo: string;
	expiredAt: string;
	totalAmount: number;
	codeUrl?: string;
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
			window.WeixinJSBridge.invoke(
				"getBrandWCPayRequest",
				params,
				(res) => {
					if (res.err_msg === "get_brand_wcpay_request:ok") {
						resolve();
						return;
					}
					reject(new Error(res.err_msg));
				},
			);
		};

		if (window.WeixinJSBridge) {
			handler();
			return;
		}

		document.addEventListener("WeixinJSBridgeReady", handler, false);
	});
};

export function PaymentModal({
	open,
	onOpenChange,
	eventId,
	order,
	onPaymentSuccess,
}: PaymentModalProps) {
	const pathname = usePathname();
	const t = useTranslations("events.registration.payment");
	const locale = pathname.split("/")[1] || "zh";
	const [status, setStatus] = useState<string>("PENDING");
	const [invites, setInvites] = useState<InviteInfo[]>([]);
	const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
	const [pollingError, setPollingError] = useState<string | null>(null);
	const successHandledRef = useRef(false);
	const jsapiInvokedRef = useRef(false);
	const invitesLoadedRef = useRef(false);
	const pollFailureCountRef = useRef(0);
	const pollErrorNotifiedRef = useRef(false);

	const expiresAt = useMemo(
		() => new Date(order.expiredAt),
		[order.expiredAt],
	);

	useEffect(() => {
		if (!open) return;
		setStatus("PENDING");
		setInvites([]);
		setPollingError(null);
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

	const fetchOrderStatus = async () => {
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
			}
		} catch (error) {
			console.error("Failed to fetch order status", error);
			handlePollFailure();
		}
	};

	useEffect(() => {
		if (!open) return;
		fetchOrderStatus();
		const interval = window.setInterval(fetchOrderStatus, 3000);
		return () => window.clearInterval(interval);
	}, [open, order.orderId, eventId]);

	useEffect(() => {
		if (!open || !order.jsapiParams || jsapiInvokedRef.current) return;
		jsapiInvokedRef.current = true;
		invokeWechatPay(order.jsapiParams)
			.then(() => fetchOrderStatus())
			.catch((error) => {
				console.error("WeChat JSAPI error", error);
				toast.error(t("wechatPayIncomplete"));
			});
	}, [open, order.jsapiParams]);

	useEffect(() => {
		if (!open) return;
		if (status === "PENDING" && Date.now() >= expiresAt.getTime()) {
			fetch(`/api/events/${eventId}/orders/${order.orderId}/cancel`, {
				method: "POST",
			});
			setStatus("CANCELLED");
		}
	}, [remainingSeconds, status, open, eventId, order.orderId, expiresAt]);

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
					{status === "PENDING" && order.codeUrl && (
						<div className="flex flex-col items-center space-y-3">
							<QRCode value={order.codeUrl} size={200} />
							<div className="text-sm text-muted-foreground">
								{t("scanToPay")}
							</div>
						</div>
					)}
					{status === "PENDING" &&
						!order.codeUrl &&
						order.jsapiParams && (
							<div className="text-sm text-muted-foreground">
								{t("invoking")}
							</div>
						)}
					{status === "PAID" && (
						<div className="text-sm text-green-600">
							{t("paidSuccess")}
						</div>
					)}
					{status === "CANCELLED" && (
						<div className="text-sm text-red-600">
							{t("orderCancelled")}
						</div>
					)}

					{status === "PENDING" && (
						<div className="flex items-center justify-between text-sm">
							<span>{t("remainingTime")}</span>
							<span className="font-medium">
								{formatCountdown()}
							</span>
						</div>
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
								const url = `${origin}/${locale}/events/${eventId}/register?gift=${invite.code}`;
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
								{t("cancelOrder")}
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
