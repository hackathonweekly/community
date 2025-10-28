import { logger } from "@/lib/logs";
import type {
	CreateCheckoutLink,
	CreateCustomerPortalLink,
	WebhookHandler,
} from "../../types";

const DISABLED_MESSAGE =
	"WeChat Pay integration is currently disabled and unavailable.";

export const createCheckoutLink: CreateCheckoutLink = async () => {
	logger.warn(DISABLED_MESSAGE);
	return null;
};

export const createCustomerPortalLink: CreateCustomerPortalLink = async () => {
	logger.warn(DISABLED_MESSAGE);
	return null;
};

export const webhookHandler: WebhookHandler = async () => {
	logger.warn(DISABLED_MESSAGE);
	return new Response("WeChat Pay is disabled.", { status: 503 });
};
