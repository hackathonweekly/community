"use client";

import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type React from "react";
import { cn } from "@/lib/utils";

interface ManagementButtonProps {
	eventId: string;
	isEventAdmin: boolean;
	variant?: React.ComponentProps<typeof Button>["variant"];
	size?: React.ComponentProps<typeof Button>["size"];
	className?: string;
}

export function ManagementButton({
	eventId,
	isEventAdmin,
	variant = "outline",
	size = "sm",
	className,
}: ManagementButtonProps) {
	const t = useTranslations("events");

	if (!isEventAdmin) {
		return null;
	}

	return (
		<Link href={`/app/events/${eventId}/manage`}>
			<Button
				variant={variant}
				size={size}
				className={cn("flex items-center gap-2", className)}
			>
				<Settings className="h-4 w-4" />
				{t("manageEventShort")}
			</Button>
		</Link>
	);
}
