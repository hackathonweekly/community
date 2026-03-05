import {
	adminClient,
	genericOAuthClient,
	inferAdditionalFields,
	magicLinkClient,
	organizationClient,
	phoneNumberClient,
	twoFactorClient,
	usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "@community/lib-server/auth";
import { wechatOAuthClient } from "./plugins/wechat-oauth-client";

export const authClient = createAuthClient({
	plugins: [
		inferAdditionalFields<typeof auth>(),
		genericOAuthClient(),
		magicLinkClient(),
		organizationClient(),
		adminClient(),
		phoneNumberClient(),
		twoFactorClient(),
		usernameClient(),
		// 🔧 添加微信OAuth客户端插件
		wechatOAuthClient(),
	],
} as any) as any;

export const { useSession } = authClient as any;

export type AuthClientErrorCodes = typeof authClient.$ERROR_CODES & {
	INVALID_INVITATION: string;
};
