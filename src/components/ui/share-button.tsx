"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ShareButtonProps {
	url?: string;
	title?: string;
	className?: string;
}

export function ShareButton({
	url = typeof window !== "undefined" ? window.location.href : "",
	title = "分享链接",
	className = "",
}: ShareButtonProps) {
	const [isLoading, setIsLoading] = useState(false);
	const toastsT = useTranslations("common.toasts");

	const handleShare = async () => {
		setIsLoading(true);
		try {
			// Try to use the Web Share API if available
			if (navigator.share) {
				await navigator.share({
					title: title,
					url: url,
				});
				toast.success(toastsT("shareSuccess"));
			} else {
				// Fallback to clipboard
				await navigator.clipboard.writeText(url);
				toast.success(toastsT("linkCopied"));
			}
		} catch (error) {
			// If clipboard fails, show URL for manual copy
			console.error("Share failed:", error);
			toast.error(toastsT("shareFailed"));
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Button
			variant="outline"
			size="sm"
			onClick={handleShare}
			disabled={isLoading}
			className={`flex items-center gap-2 ${className}`}
		>
			<Share2 className="h-4 w-4" />
			分享链接
		</Button>
	);
}
