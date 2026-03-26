"use client";

import { useSession } from "@shared/auth/hooks/use-session";
import { useEffect, useRef } from "react";
import { buildWechatPaymentClientContext } from "./wechat-payment-client-context";

const MINI_OPENID_BIND_ATTEMPT_KEY = "__hwMiniOpenIdBindAttemptAt";
const MINI_OPENID_BIND_COOLDOWN_MS = 5 * 60 * 1000;
const MINI_OPENID_BIND_RETURN_DELAY_MS = 400;

const readBindAttemptAt = () => {
	if (typeof window === "undefined") {
		return 0;
	}

	const rawValue = window.sessionStorage.getItem(
		MINI_OPENID_BIND_ATTEMPT_KEY,
	);
	if (!rawValue) {
		return 0;
	}

	const parsed = Number.parseInt(rawValue, 10);
	return Number.isFinite(parsed) ? parsed : 0;
};

const writeBindAttemptAt = (timestamp: number) => {
	if (typeof window === "undefined") {
		return;
	}

	window.sessionStorage.setItem(
		MINI_OPENID_BIND_ATTEMPT_KEY,
		String(timestamp),
	);
};

const clearBindAttemptAt = () => {
	if (typeof window === "undefined") {
		return;
	}

	window.sessionStorage.removeItem(MINI_OPENID_BIND_ATTEMPT_KEY);
};

export function MiniProgramOpenIdBinder() {
	const { loaded, user, reloadSession } = useSession();
	const bindingInFlightRef = useRef(false);
	const awaitingReturnRef = useRef(false);
	const bridgeBootstrapStartedRef = useRef(false);

	useEffect(() => {
		if (bridgeBootstrapStartedRef.current) {
			return;
		}

		bridgeBootstrapStartedRef.current = true;

		buildWechatPaymentClientContext().catch((error) => {
			console.warn(
				"[MINI_BRIDGE_BOOTSTRAP] Failed to persist mini bridge context",
				error,
			);
		});
	}, []);

	useEffect(() => {
		if (user?.wechatMiniOpenId) {
			bindingInFlightRef.current = false;
			awaitingReturnRef.current = false;
			clearBindAttemptAt();
		}
	}, [user?.wechatMiniOpenId]);

	useEffect(() => {
		if (typeof document === "undefined") {
			return;
		}

		const handleReturn = () => {
			if (
				document.visibilityState !== "visible" ||
				!awaitingReturnRef.current
			) {
				return;
			}

			awaitingReturnRef.current = false;
			window.setTimeout(() => {
				reloadSession()
					.catch((error) => {
						console.warn(
							"[MINI_OPENID_BIND] Failed to reload session after bind",
							error,
						);
					})
					.finally(() => {
						bindingInFlightRef.current = false;
					});
			}, MINI_OPENID_BIND_RETURN_DELAY_MS);
		};

		document.addEventListener("visibilitychange", handleReturn);
		window.addEventListener("focus", handleReturn);

		return () => {
			document.removeEventListener("visibilitychange", handleReturn);
			window.removeEventListener("focus", handleReturn);
		};
	}, [reloadSession]);

	useEffect(() => {
		if (!loaded || !user?.id || user.wechatMiniOpenId) {
			return;
		}

		if (bindingInFlightRef.current) {
			return;
		}

		if (Date.now() - readBindAttemptAt() < MINI_OPENID_BIND_COOLDOWN_MS) {
			return;
		}

		let cancelled = false;

		const bootstrapMiniOpenId = async () => {
			const clientContext = await buildWechatPaymentClientContext();
			if (
				clientContext.environmentType !== "miniprogram" ||
				clientContext.miniProgramBridgeSupported !== true
			) {
				return;
			}

			const navigateTo = window.wx?.miniProgram?.navigateTo;
			if (typeof navigateTo !== "function") {
				return;
			}

			bindingInFlightRef.current = true;
			writeBindAttemptAt(Date.now());

			try {
				const response = await fetch(
					"/api/payments/wechat/mini-bind-token",
					{
						method: "POST",
					},
				);
				if (!response.ok) {
					throw new Error(
						`mini-bind-token failed: ${response.status}`,
					);
				}

				const result = await response.json();
				const bindToken = result?.data?.bindToken;
				if (typeof bindToken !== "string" || !bindToken) {
					throw new Error("Missing mini bind token");
				}

				if (cancelled) {
					return;
				}

				const baseUrl = encodeURIComponent(window.location.origin);
				await new Promise<void>((resolve, reject) => {
					navigateTo({
						url: `/pages/bind/bind?token=${encodeURIComponent(bindToken)}&baseUrl=${baseUrl}`,
						success: () => resolve(),
						fail: (error) => {
							reject(
								new Error(
									error?.errMsg ||
										"navigateTo mini bind page failed",
								),
							);
						},
					});
				});

				if (cancelled) {
					return;
				}

				awaitingReturnRef.current = true;
			} catch (error) {
				bindingInFlightRef.current = false;
				console.warn("[MINI_OPENID_BIND] Bootstrap skipped", error);
			}
		};

		bootstrapMiniOpenId();

		return () => {
			cancelled = true;
		};
	}, [loaded, user?.id, user?.wechatMiniOpenId]);

	return null;
}
