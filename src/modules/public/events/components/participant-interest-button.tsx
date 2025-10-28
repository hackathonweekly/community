"use client";

import { Button } from "@/components/ui/button";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface ParticipantInterestButtonProps {
	eventId: string;
	targetUserId: string;
	initialInterested?: boolean;
	disabled?: boolean;
	size?: "sm" | "default";
}

export function ParticipantInterestButton({
	eventId,
	targetUserId,
	initialInterested = false,
	disabled = false,
	size = "sm",
}: ParticipantInterestButtonProps) {
	const t = useTranslations();
	const [isInterested, setIsInterested] = useState(initialInterested);
	const [isLoading, setIsLoading] = useState(false);

	const handleToggleInterest = async () => {
		if (disabled || isLoading) return;

		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/events/${eventId}/participant-interests`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						targetUserId,
					}),
				},
			);

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Failed to toggle interest");
			}

			setIsInterested(result.data.interested);

			if (result.data.interested) {
				toast.success(t("events.participantsSection.interestAdded"));
			} else {
				toast.success(t("events.participantsSection.interestRemoved"));
			}
		} catch (error) {
			console.error("Error toggling interest:", error);
			toast.error(
				error instanceof Error
					? error.message
					: t("events.participantsSection.interestToggleFailed"),
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Button
			variant={isInterested ? "default" : "outline"}
			size={size}
			onClick={handleToggleInterest}
			disabled={disabled || isLoading}
			className="flex items-center gap-1"
		>
			{isInterested ? (
				<HeartSolidIcon className="w-4 h-4 text-red-500" />
			) : (
				<HeartIcon className="w-4 h-4" />
			)}
			<span className="text-xs">
				{isInterested
					? t("events.participantsSection.interested")
					: t("events.participantsSection.interest")}
			</span>
		</Button>
	);
}
