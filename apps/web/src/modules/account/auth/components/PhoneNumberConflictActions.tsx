"use client";

import { authClient } from "@community/lib-client/auth/client";
import { Button } from "@community/ui/ui/button";
import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface PhoneNumberConflictActionsProps {
	phoneNumber: string;
	redirectTo?: string;
	onUseAnotherPhone?: () => void;
}

export function PhoneNumberConflictActions({
	phoneNumber,
	redirectTo,
	onUseAnotherPhone,
}: PhoneNumberConflictActionsProps) {
	const t = useTranslations();
	const [isSigningOut, setIsSigningOut] = useState(false);

	const handleSignOutAndSwitch = () => {
		if (!phoneNumber || isSigningOut) {
			return;
		}

		const params = new URLSearchParams();
		params.set("phoneNumber", phoneNumber);

		const nextRedirectTo =
			redirectTo ??
			`${window.location.pathname}${window.location.search}`;
		if (nextRedirectTo) {
			params.set("redirectTo", nextRedirectTo);
		}

		const loginUrl = `/auth/login/phone?${params.toString()}`;

		setIsSigningOut(true);
		authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					window.location.href = loginUrl;
				},
				onError: () => {
					setIsSigningOut(false);
				},
			},
		});
	};

	return (
		<div className="flex flex-col gap-2 sm:flex-row">
			<Button
				type="button"
				size="sm"
				variant="outline"
				onClick={handleSignOutAndSwitch}
				disabled={isSigningOut || !phoneNumber}
			>
				{isSigningOut && (
					<Loader2Icon className="mr-2 size-4 animate-spin" />
				)}
				{t("auth.bindPhone.signOutAndContinueWithPhone")}
			</Button>
			{onUseAnotherPhone && (
				<Button
					type="button"
					size="sm"
					variant="ghost"
					onClick={onUseAnotherPhone}
					disabled={isSigningOut}
				>
					{t("auth.bindPhone.tryAnotherPhone")}
				</Button>
			)}
		</div>
	);
}
