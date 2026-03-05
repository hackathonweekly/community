"use client";

import { Button } from "@community/ui/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@community/ui/ui/dialog";
import { useRouter } from "@/hooks/router";
import { useSession } from "@dashboard/auth/hooks/use-session";
import { useTranslations } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const PHONE_BINDING_SKIP_UNTIL_KEY = "hw.phoneBinding.skipUntil";
const SKIP_DURATION_MS = 24 * 60 * 60 * 1000;

function isWeChatUser(user: {
	email?: string | null;
	wechatId?: string | null;
	wechatOpenId?: string | null;
	wechatUnionId?: string | null;
}) {
	return Boolean(
		user.wechatUnionId ||
			user.wechatOpenId ||
			user.wechatId ||
			user.email?.endsWith("@wechat.app"),
	);
}

function needsPhoneBinding(user: {
	email?: string | null;
	wechatId?: string | null;
	wechatOpenId?: string | null;
	wechatUnionId?: string | null;
	phoneNumber?: string | null;
	phoneNumberVerified?: boolean | null;
}) {
	return (
		isWeChatUser(user) &&
		(!user.phoneNumber || user.phoneNumberVerified !== true)
	);
}

export function PhoneBindingPrompt() {
	const t = useTranslations();
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { user, loaded } = useSession();

	const [open, setOpen] = useState(false);

	const currentPath = useMemo(() => {
		const query = searchParams?.toString();
		return query ? `${pathname}?${query}` : pathname;
	}, [pathname, searchParams]);

	const skip = useCallback((durationMs = SKIP_DURATION_MS) => {
		try {
			window.localStorage.setItem(
				PHONE_BINDING_SKIP_UNTIL_KEY,
				String(Date.now() + durationMs),
			);
		} catch {
			// ignore
		}
		setOpen(false);
	}, []);

	const goBind = useCallback(() => {
		const redirectTo = currentPath || "/";
		router.push(
			`/auth/bind-phone?redirectTo=${encodeURIComponent(redirectTo)}`,
		);
	}, [currentPath, router]);

	useEffect(() => {
		if (!loaded || !user) return;
		if (!needsPhoneBinding(user)) {
			setOpen(false);
			return;
		}

		let skipUntil = 0;
		try {
			skipUntil = Number(
				window.localStorage.getItem(PHONE_BINDING_SKIP_UNTIL_KEY) ??
					"0",
			);
		} catch {
			skipUntil = 0;
		}

		if (Number.isFinite(skipUntil) && Date.now() < skipUntil) return;
		setOpen(true);
	}, [
		loaded,
		user,
		user?.phoneNumber,
		user?.phoneNumberVerified,
		user?.wechatUnionId,
		user?.wechatOpenId,
		user?.wechatId,
	]);

	if (!loaded || !user) return null;
	if (!needsPhoneBinding(user)) return null;

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) skip();
				else setOpen(true);
			}}
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{t("auth.phoneBindingPrompt.title")}
					</DialogTitle>
					<DialogDescription>
						{t("auth.phoneBindingPrompt.description")}
					</DialogDescription>
				</DialogHeader>
				<div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
					{t("auth.phoneBindingPrompt.note")}
				</div>
				<DialogFooter>
					<Button variant="secondary" onClick={() => skip()}>
						{t("auth.phoneBindingPrompt.skip")}
					</Button>
					<Button onClick={goBind}>
						{t("auth.phoneBindingPrompt.bindNow")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
