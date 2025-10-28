"use client";

import { Button } from "@/components/ui/button";
import { config } from "@/config";
import { authClient } from "@/lib/auth/client";
import "@/lib/auth/plugins/wechat-oauth-client";
import { getWeChatEnvironmentInfo } from "@/lib/utils/wechat-environment";
import { useLocale } from "next-intl";
import { useQueryState } from "nuqs";
import { parseAsString } from "nuqs";
import { oAuthProviders } from "../constants/oauth-providers";

export function SocialSigninButton({
	provider,
	className,
	disabled = false,
	acceptedAgreements = false,
	onAgreementRequired,
}: {
	provider: keyof typeof oAuthProviders;
	className?: string;
	disabled?: boolean;
	acceptedAgreements?: boolean;
	onAgreementRequired?: (context: {
		provider: keyof typeof oAuthProviders;
		trigger: () => Promise<unknown>;
	}) => void;
}) {
	const [invitationId] = useQueryState("invitationId", parseAsString);
	const [redirectTo] = useQueryState("redirectTo", parseAsString);
	const locale = useLocale();
	const providerData = oAuthProviders[provider];

	const redirectPath = invitationId
		? `/app/organization-invitation/${invitationId}`
		: (redirectTo ?? config.auth.redirectAfterSignIn);

	const performSignIn = async () => {
		const callbackURL = new URL(redirectPath, window.location.origin);

		// 微信登录使用智能设备检测
		if (provider === "wechat") {
			try {
				// 使用新的微信环境检测工具
				const wechatInfo = getWeChatEnvironmentInfo();

				let result;
				// 根据环境类型选择合适的登录方式
				if (
					wechatInfo.isMiniProgram ||
					(wechatInfo.isWeChat && wechatInfo.isMobile)
				) {
					// 小程序webview 或 微信移动端浏览器 -> 使用服务号配置（移动端）
					result = await (authClient as any).signInWithWeChatMobile({
						callbackURL: callbackURL.toString(),
					});
				} else {
					// 其他环境（包括PC端浏览器） -> 使用网站应用配置（PC端扫码）
					result = await (authClient as any).signInWithWeChatPC({
						callbackURL: callbackURL.toString(),
					});
				}

				// 重定向到微信授权页面
				if (result.redirect && result.url) {
					window.location.href = result.url;
				}
			} catch (error) {
				console.error("WeChat login failed:", error);
			}
		} else {
			// 其他社交登录使用Better Auth
			authClient.signIn.social({
				provider: provider as any,
				callbackURL: callbackURL.toString(),
			});
		}
	};

	// 获取显示文本，微信按钮统一显示"微信登录"
	const getDisplayText = () => {
		if (provider === "wechat") {
			return "微信登录";
		}
		return providerData.name;
	};

	const handleClick = async () => {
		if (!acceptedAgreements) {
			onAgreementRequired?.({
				provider,
				trigger: performSignIn,
			});
			return;
		}
		await performSignIn();
	};

	return (
		<Button
			onClick={handleClick}
			variant="outline"
			type="button"
			className={className}
			disabled={disabled}
		>
			{providerData.icon && (
				<i
					className={`mr-2 text-primary ${provider === "wechat" ? "text-lg" : ""}`}
				>
					<providerData.icon
						className={provider === "wechat" ? "size-5" : "size-4"}
					/>
				</i>
			)}
			{getDisplayText()}
		</Button>
	);
}
