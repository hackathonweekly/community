"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { authClient } from "@/lib/auth/client";
import "@/lib/auth/plugins/wechat-oauth-client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

const isWeChatMobileEnv = (userAgent: string) => {
	const isWeChat = /MicroMessenger/i.test(userAgent);
	const isMobile =
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			userAgent,
		);
	return isWeChat && isMobile;
};

interface WeChatBindingPromptProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	message?: string | null;
}

export function WeChatBindingPrompt({
	open,
	onOpenChange,
	message,
}: WeChatBindingPromptProps) {
	const t = useTranslations("events.registration.wechatBinding");
	const [isBinding, setIsBinding] = useState(false);

	const handleBind = async () => {
		if (isBinding) return;
		setIsBinding(true);
		try {
			const callbackURL = window.location.href;
			const userAgent = window.navigator.userAgent;
			const result = isWeChatMobileEnv(userAgent)
				? await (authClient as any).linkWeChatMobile({ callbackURL })
				: await (authClient as any).linkWeChatPC({ callbackURL });

			if (result?.redirect && result?.url) {
				window.location.href = result.url;
			}
		} catch (error) {
			console.error("WeChat link failed:", error);
			toast.error(t("linkFailed"));
		} finally {
			setIsBinding(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>
						{message?.trim() || t("description")}
					</DialogDescription>
				</DialogHeader>
				<div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
					{t("note")}
				</div>
				<DialogFooter>
					<Button
						variant="secondary"
						onClick={() => onOpenChange(false)}
						disabled={isBinding}
					>
						{t("cancel")}
					</Button>
					<Button onClick={handleBind} disabled={isBinding}>
						{isBinding ? t("binding") : t("bindNow")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
