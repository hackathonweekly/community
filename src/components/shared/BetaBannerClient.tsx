"use client";

import {
	Banner,
	BannerClose,
	BannerTitle,
} from "@/components/ui/shadcn-io/banner";
import { useBannerStore } from "@/lib/stores/banner-store";
import { useEffect } from "react";

interface BetaBannerClientProps {
	enabled: boolean;
	label: string;
	message: string;
	contentSignature: string | null;
}

export function BetaBannerClient({
	enabled,
	label,
	message,
	contentSignature,
}: BetaBannerClientProps) {
	const {
		isBetaBannerVisible,
		isHydrated,
		hideBetaBanner,
		showBetaBanner,
		contentHash,
		setContentHash,
	} = useBannerStore();

	useEffect(() => {
		if (!isHydrated) {
			return;
		}

		const hasContent = Boolean(label && message);

		if (!enabled || !hasContent) {
			if (contentHash !== null) {
				setContentHash(null);
			}
			if (isBetaBannerVisible) {
				hideBetaBanner();
			}
			return;
		}

		if (contentSignature && contentHash !== contentSignature) {
			setContentHash(contentSignature);
			showBetaBanner();
		}
	}, [
		enabled,
		contentHash,
		contentSignature,
		hideBetaBanner,
		isBetaBannerVisible,
		isHydrated,
		label,
		message,
		setContentHash,
		showBetaBanner,
	]);

	if (!enabled || !label || !message || !isHydrated || !isBetaBannerVisible) {
		return null;
	}

	return (
		<Banner
			className="bg-black text-white fixed top-0 left-0 w-full z-[60] py-1"
			onClose={hideBetaBanner}
			visible={isBetaBannerVisible}
		>
			<BannerTitle className="flex-1 text-center">
				<span className="font-semibold">{label}</span> · {message}
			</BannerTitle>
			<BannerClose className="text-white hover:bg-white/10" />
		</Banner>
	);
}
