export * from "./provider";
export * from "./lib/customer";

import * as stripeProvider from "./provider/stripe";
import * as wechatpayProvider from "./provider/wechatpay";
import type { PaymentProvider } from "./types";

export function getPaymentProvider(): PaymentProvider {
	const preferredProvider =
		process.env.PREFERRED_PAYMENT_PROVIDER || "stripe";

	switch (preferredProvider.toLowerCase()) {
		case "wechatpay":
			return {
				createCheckoutLink: wechatpayProvider.createCheckoutLink,
				createCustomerPortalLink:
					wechatpayProvider.createCustomerPortalLink,
				webhookHandler: wechatpayProvider.webhookHandler,
			};
		default:
			return {
				createCheckoutLink: stripeProvider.createCheckoutLink,
				createCustomerPortalLink:
					stripeProvider.createCustomerPortalLink,
				webhookHandler: stripeProvider.webhookHandler,
			};
	}
}

export const createCheckoutLink = (
	params: Parameters<PaymentProvider["createCheckoutLink"]>[0],
) => {
	return getPaymentProvider().createCheckoutLink(params);
};

export const createCustomerPortalLink = (
	params: Parameters<PaymentProvider["createCustomerPortalLink"]>[0],
) => {
	return getPaymentProvider().createCustomerPortalLink(params);
};

export const handlePaymentWebhook = (req: Request) => {
	return getPaymentProvider().webhookHandler(req);
};
