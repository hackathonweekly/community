import {
	adminClient,
	genericOAuthClient,
	inferAdditionalFields,
	magicLinkClient,
	organizationClient,
	passkeyClient,
	phoneNumberClient,
	twoFactorClient,
	usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from ".";
import { wechatOAuthClient } from "./plugins/wechat-oauth-client";

export const authClient = createAuthClient({
	plugins: [
		inferAdditionalFields<typeof auth>(),
		genericOAuthClient(),
		magicLinkClient(),
		organizationClient(),
		adminClient(),
		passkeyClient(),
		phoneNumberClient(),
		twoFactorClient(),
		usernameClient(),
		// 🔧 添加微信OAuth客户端插件
		wechatOAuthClient(),
	],
});

export const { useSession } = authClient;

export type AuthClientErrorCodes = typeof authClient.$ERROR_CODES & {
	INVALID_INVITATION: string;
};
