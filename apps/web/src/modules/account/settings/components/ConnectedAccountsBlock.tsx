"use client";
import { authClient } from "@community/lib-client/auth/client";
import "@community/lib-client/auth/plugins/wechat-oauth-client";
import {
	type OAuthProvider,
	oAuthProviders,
} from "@account/auth/constants/oauth-providers";
import { useUserAccountsQuery } from "@account/auth/lib/api";
import { SettingsItem } from "@shared/components/SettingsItem";
import { Button } from "@community/ui/ui/button";
import { Skeleton } from "@community/ui/ui/skeleton";
import { CheckCircle2Icon, LinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export function ConnectedAccountsBlock() {
	const t = useTranslations();

	const { data, isPending } = useUserAccountsQuery();
	const accounts = (data ?? []) as Array<{ provider?: string | null }>;

	const isProviderLinked = (provider: OAuthProvider) => {
		if (provider === "wechat") {
			// 微信可能通过 wechat-pc 或 wechat-mobile 任一 provider 连接
			return accounts.some(
				(account) =>
					account.provider === "wechat-pc" ||
					account.provider === "wechat-mobile" ||
					account.provider === "wechat",
			);
		}
		return accounts.some((account) => account.provider === provider);
	};

	const linkProvider = async (provider: OAuthProvider) => {
		const callbackURL = window.location.href;
		if (!isProviderLinked(provider)) {
			// 微信登录需要特殊处理，使用设备检测逻辑
			if (provider === "wechat") {
				try {
					// 检查设备类型和浏览器环境
					const userAgent = window.navigator.userAgent;
					const isWeChat = /MicroMessenger/i.test(userAgent);
					const isMobile =
						/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
							userAgent,
						);

					let result;
					if (isWeChat && isMobile) {
						// 微信内置浏览器 -> 使用服务号直接授权
						result = await (authClient as any).linkWeChatMobile({
							callbackURL: callbackURL,
						});
					} else {
						// 其他环境 -> 使用PC端扫码
						result = await (authClient as any).linkWeChatPC({
							callbackURL: callbackURL,
						});
					}

					// 重定向到微信授权页面
					if (result.redirect && result.url) {
						window.location.href = result.url;
					}
				} catch (error) {
					console.error("WeChat link failed:", error);
				}
			} else {
				authClient.linkSocial({
					provider: provider as any,
					callbackURL,
				});
			}
		}
	};

	return (
		<SettingsItem
			title={t("settings.account.security.connectedAccounts.title")}
		>
			<div className="grid grid-cols-1 divide-y">
				{Object.entries(oAuthProviders).map(
					([provider, providerData]) => {
						const isLinked = isProviderLinked(
							provider as OAuthProvider,
						);

						return (
							<div
								key={provider}
								className="flex h-14 items-center justify-between gap-2 py-2"
							>
								<div className="flex items-center gap-2">
									<providerData.icon className="size-4 text-primary/50" />
									<span className="text-sm">
										{providerData.name}
									</span>
								</div>
								{isPending ? (
									<Skeleton className="h-10 w-28" />
								) : isLinked ? (
									<CheckCircle2Icon className="size-6 text-success" />
								) : (
									<Button
										variant={
											isLinked ? "outline" : "outline"
										}
										onClick={() =>
											linkProvider(
												provider as OAuthProvider,
											)
										}
									>
										<LinkIcon className="mr-1.5 size-4" />
										<span>
											{t(
												"settings.account.security.connectedAccounts.connect",
											)}
										</span>
									</Button>
								)}
							</div>
						);
					},
				)}
			</div>
		</SettingsItem>
	);
}
