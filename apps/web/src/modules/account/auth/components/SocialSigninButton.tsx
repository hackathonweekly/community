"use client";

import { Button } from "@community/ui/ui/button";
import { config } from "@community/config";
import { authClient } from "@community/lib-client/auth/client";
import "@community/lib-client/auth/plugins/wechat-oauth-client";
import {
	AppErrorHandler,
	ErrorType,
} from "@community/lib-client/error/handler";
import { getWeChatEnvironmentInfo } from "@community/lib-shared/utils/wechat-environment";
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
	const providerData = oAuthProviders[provider];

	const redirectPath = invitationId
		? `/orgs/organization-invitation/${invitationId}`
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
			const { error } = await authClient.signIn.social({
				provider: provider as any,
				callbackURL: callbackURL.toString(),
			});

			if (error) {
				const rateLimitError =
					AppErrorHandler.handleRateLimitError(error);
				if (rateLimitError) {
					AppErrorHandler.showErrorToast(rateLimitError);
				} else {
					AppErrorHandler.showErrorToast(
						AppErrorHandler.createError(
							ErrorType.AUTHENTICATION,
							error.message || "Login failed",
							error.message || "登录失败，请稍后重试",
						),
					);
				}
			}
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
				<div className="mr-2 flex items-center justify-center">
					<providerData.icon className="size-7" />
				</div>
			)}
			{getDisplayText()}
		</Button>
	);
}
