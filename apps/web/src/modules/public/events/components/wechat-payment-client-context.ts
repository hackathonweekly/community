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

interface MiniProgramBridge {
	getCapabilities?: () => Promise<MiniProgramBridgeCapabilities>;
	requestPayment?: (
		params: WechatMiniProgramRequestPaymentParams,
	) => Promise<{
		ok: boolean;
		errCode?: string;
		errMsg?: string;
	}>;
}

declare global {
	interface Window {
		__HWMiniAppBridge__?: MiniProgramBridge;
	}
}

const toBooleanString = (value?: boolean) => {
	if (value === true) {
		return "true";
	}
	if (value === false) {
		return "false";
	}
	return undefined;
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

		const bridge = window.__HWMiniAppBridge__;
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
