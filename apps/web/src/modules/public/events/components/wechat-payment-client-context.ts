import { getWeChatEnvironmentType } from "@community/lib-shared/utils/browser-detect";
import type {
	WechatMiniProgramRequestPaymentParams,
	WechatPaymentClientContext,
} from "@community/lib-shared/payments/wechat-payment";

interface MiniProgramBridgeCapabilities {
	bridgeVersion?: string;
	supportsRequestPayment?: boolean;
	shellVersion?: string;
}

interface MiniProgramBridgeRequestPaymentResult {
	ok: boolean;
	errCode?: string;
	errMsg?: string;
}

interface MiniProgramBridge {
	getCapabilities?: () => Promise<MiniProgramBridgeCapabilities>;
	requestPayment?: (
		params: WechatMiniProgramRequestPaymentParams,
	) => Promise<MiniProgramBridgeRequestPaymentResult>;
}

interface MiniProgramBridgeEnvelope {
	__hwMiniBridge: string;
	type: string;
	requestId?: string;
	payload?: unknown;
}

interface WechatMiniProgramRuntime {
	postMessage?: (params: { data: MiniProgramBridgeEnvelope }) => void;
}

interface WechatRuntime {
	miniProgram?: WechatMiniProgramRuntime;
}

declare global {
	interface Window {
		__HWMiniAppBridge__?: MiniProgramBridge;
		wx?: WechatRuntime;
	}
}

const BRIDGE_NAME = "HW_MINI_PAYMENT_BRIDGE";
const BRIDGE_GET_CAPABILITIES = "HW_MINI_BRIDGE_GET_CAPABILITIES";
const BRIDGE_REQUEST_PAYMENT = "HW_MINI_BRIDGE_REQUEST_PAYMENT";
const BRIDGE_RESPONSE_TYPE = "HW_MINI_BRIDGE_RESPONSE";

const CAPABILITIES_TIMEOUT_MS = 5_000;
const REQUEST_PAYMENT_TIMEOUT_MS = 35_000;

const pendingBridgeRequests = new Map<
	string,
	{
		resolve: (payload: unknown) => void;
		timeoutId: number;
	}
>();

let messageListenerBound = false;

const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const isBridgeEnvelope = (
	value: unknown,
): value is MiniProgramBridgeEnvelope => {
	if (!isObject(value)) {
		return false;
	}
	if (value.__hwMiniBridge !== BRIDGE_NAME) {
		return false;
	}
	if (typeof value.type !== "string") {
		return false;
	}
	if (value.requestId !== undefined && typeof value.requestId !== "string") {
		return false;
	}
	return true;
};

const resolveBridgeEnvelope = (
	value: unknown,
): MiniProgramBridgeEnvelope | null => {
	const queue: unknown[] = [value];

	while (queue.length > 0) {
		const current = queue.shift();
		if (Array.isArray(current)) {
			queue.push(...current);
			continue;
		}
		if (!isObject(current)) {
			continue;
		}
		if (isBridgeEnvelope(current)) {
			return current;
		}
		if ("data" in current) {
			queue.push(current.data);
		}
	}

	return null;
};

const parseCapabilitiesPayload = (
	payload: unknown,
): MiniProgramBridgeCapabilities => {
	if (!isObject(payload)) {
		return {
			supportsRequestPayment: false,
		};
	}

	return {
		bridgeVersion:
			typeof payload.bridgeVersion === "string"
				? payload.bridgeVersion
				: undefined,
		supportsRequestPayment:
			typeof payload.supportsRequestPayment === "boolean"
				? payload.supportsRequestPayment
				: undefined,
		shellVersion:
			typeof payload.shellVersion === "string"
				? payload.shellVersion
				: undefined,
	};
};

const parseRequestPaymentPayload = (
	payload: unknown,
): MiniProgramBridgeRequestPaymentResult => {
	if (!isObject(payload)) {
		return {
			ok: false,
			errCode: "PAY_FAILED",
			errMsg: "Invalid bridge response",
		};
	}

	return {
		ok: payload.ok === true,
		errCode:
			typeof payload.errCode === "string" ? payload.errCode : undefined,
		errMsg: typeof payload.errMsg === "string" ? payload.errMsg : undefined,
	};
};

const bindMiniProgramMessageListener = () => {
	if (messageListenerBound || typeof window === "undefined") {
		return;
	}

	const handleBridgeMessage = (event: unknown) => {
		let payload: unknown = undefined;
		if (isObject(event) && "data" in event) {
			payload = event.data;
		} else if (
			isObject(event) &&
			"detail" in event &&
			isObject(event.detail) &&
			"data" in event.detail
		) {
			payload = event.detail.data;
		}

		const envelope = resolveBridgeEnvelope(payload);
		if (!envelope || envelope.type !== BRIDGE_RESPONSE_TYPE) {
			return;
		}
		if (typeof envelope.requestId !== "string") {
			return;
		}

		const pending = pendingBridgeRequests.get(envelope.requestId);
		if (!pending) {
			return;
		}

		window.clearTimeout(pending.timeoutId);
		pendingBridgeRequests.delete(envelope.requestId);
		pending.resolve(envelope.payload);
	};

	window.addEventListener("message", handleBridgeMessage as EventListener);

	if (typeof document !== "undefined") {
		document.addEventListener(
			"message",
			handleBridgeMessage as EventListener,
		);
	}

	messageListenerBound = true;
};

const callMiniProgramBridge = <TResult>(params: {
	type: string;
	payload?: unknown;
	timeoutMs: number;
	parseResult: (payload: unknown) => TResult;
}): Promise<TResult> => {
	if (typeof window === "undefined") {
		return Promise.reject(new Error("Window not available"));
	}

	const postMessage = window.wx?.miniProgram?.postMessage;
	if (typeof postMessage !== "function") {
		return Promise.reject(new Error("BRIDGE_NOT_SUPPORTED"));
	}

	bindMiniProgramMessageListener();

	const requestId = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
	return new Promise<TResult>((resolve, reject) => {
		const timeoutId = window.setTimeout(() => {
			pendingBridgeRequests.delete(requestId);
			reject(new Error("BRIDGE_TIMEOUT"));
		}, params.timeoutMs);

		pendingBridgeRequests.set(requestId, {
			resolve: (payload) => {
				resolve(params.parseResult(payload));
			},
			timeoutId,
		});

		try {
			postMessage({
				data: {
					__hwMiniBridge: BRIDGE_NAME,
					type: params.type,
					requestId,
					payload: params.payload,
				},
			});
		} catch (error) {
			window.clearTimeout(timeoutId);
			pendingBridgeRequests.delete(requestId);
			reject(
				error instanceof Error
					? error
					: new Error("BRIDGE_NOT_SUPPORTED"),
			);
		}
	});
};

const createMiniProgramMessageBridge = (): MiniProgramBridge | undefined => {
	if (typeof window === "undefined") {
		return undefined;
	}

	if (window.__HWMiniAppBridge__) {
		return window.__HWMiniAppBridge__;
	}

	if (typeof window.wx?.miniProgram?.postMessage !== "function") {
		return undefined;
	}

	window.__HWMiniAppBridge__ = {
		getCapabilities: () =>
			callMiniProgramBridge<MiniProgramBridgeCapabilities>({
				type: BRIDGE_GET_CAPABILITIES,
				timeoutMs: CAPABILITIES_TIMEOUT_MS,
				parseResult: parseCapabilitiesPayload,
			}),
		requestPayment: (requestPaymentParams) =>
			callMiniProgramBridge<MiniProgramBridgeRequestPaymentResult>({
				type: BRIDGE_REQUEST_PAYMENT,
				payload: requestPaymentParams,
				timeoutMs: REQUEST_PAYMENT_TIMEOUT_MS,
				parseResult: parseRequestPaymentPayload,
			}),
	};

	return window.__HWMiniAppBridge__;
};

const toBooleanString = (value?: boolean) => {
	if (value === true) {
		return "true";
	}
	if (value === false) {
		return "false";
	}
	return undefined;
};

export const ensureWechatMiniProgramBridge = ():
	| MiniProgramBridge
	| undefined => {
	if (typeof window === "undefined") {
		return undefined;
	}

	return window.__HWMiniAppBridge__ ?? createMiniProgramMessageBridge();
};

export const buildWechatPaymentClientContext =
	async (): Promise<WechatPaymentClientContext> => {
		if (typeof window === "undefined") {
			return { environmentType: "none" };
		}

		const environmentType = getWeChatEnvironmentType();
		if (environmentType !== "miniprogram") {
			return { environmentType };
		}

		const bridge = ensureWechatMiniProgramBridge();
		if (!bridge?.getCapabilities) {
			return {
				environmentType,
				miniProgramBridgeSupported: false,
			};
		}

		try {
			const capabilities = await bridge.getCapabilities();
			return {
				environmentType,
				miniProgramBridgeSupported:
					capabilities.supportsRequestPayment === true,
				miniProgramBridgeVersion: capabilities.bridgeVersion,
				shellVersion: capabilities.shellVersion,
			};
		} catch {
			return {
				environmentType,
				miniProgramBridgeSupported: false,
			};
		}
	};

export const buildWechatPaymentClientContextQuery = (
	clientContext: WechatPaymentClientContext,
) => {
	const params = new URLSearchParams();
	if (clientContext.environmentType) {
		params.set("environmentType", clientContext.environmentType);
	}

	const bridgeSupported = toBooleanString(
		clientContext.miniProgramBridgeSupported,
	);
	if (bridgeSupported) {
		params.set("miniProgramBridgeSupported", bridgeSupported);
	}

	if (clientContext.miniProgramBridgeVersion) {
		params.set(
			"miniProgramBridgeVersion",
			clientContext.miniProgramBridgeVersion,
		);
	}

	if (clientContext.shellVersion) {
		params.set("shellVersion", clientContext.shellVersion);
	}

	return params.toString();
};
