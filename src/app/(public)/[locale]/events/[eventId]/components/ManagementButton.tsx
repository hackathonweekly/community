"use client";

import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface ManagementButtonProps {
	eventId: string;
	isEventAdmin: boolean;
}

export function ManagementButton({
	eventId,
	isEventAdmin,
}: ManagementButtonProps) {
	const t = useTranslations("events");

	if (!isEventAdmin) {
		return null;
	}

	return (
		<Link href={`/app/events/${eventId}/manage`}>
			<Button
				variant="outline"
				size="sm"
				className="flex items-center gap-2"
			>
				<Settings className="h-4 w-4" />
				{t("manageEventShort")}
			</Button>
		</Link>
	);
}
