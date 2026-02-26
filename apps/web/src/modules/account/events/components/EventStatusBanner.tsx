"use client";

import { Button } from "@community/ui/ui/button";
import { Card, CardContent } from "@community/ui/ui/card";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

interface EventStatusBannerProps {
	event: {
		status: string;
	};
}

export function EventStatusBanner({ event }: EventStatusBannerProps) {
	const t = useTranslations("events.manage");

	if (event.status === "PUBLISHED") {
		return null;
	}

	// Define status styles and icons
	const statusConfig = {
		DRAFT: {
			bgColor: "bg-yellow-50",
			borderColor: "border-yellow-200",
			textColor: "text-yellow-800",
			iconColor: "text-yellow-600",
		},
		REGISTRATION_CLOSED: {
			bgColor: "bg-red-50",
			borderColor: "border-red-200",
			textColor: "text-red-800",
			iconColor: "text-red-600",
		},
		ONGOING: {
			bgColor: "bg-blue-50",
			borderColor: "border-blue-200",
			textColor: "text-blue-800",
			iconColor: "text-blue-600",
		},
		COMPLETED: {
			bgColor: "bg-muted",
			borderColor: "border-border",
			textColor: "text-foreground",
			iconColor: "text-muted-foreground",
		},
		CANCELLED: {
			bgColor: "bg-muted",
			borderColor: "border-border",
			textColor: "text-foreground",
			iconColor: "text-muted-foreground",
		},
	};

	const config =
		statusConfig[event.status as keyof typeof statusConfig] ||
		statusConfig.DRAFT;

	return (
		<Card
			className={`mb-3 md:mb-6 ${config.borderColor} ${config.bgColor}`}
		>
			<CardContent className="p-2 md:p-4">
				<div className="flex items-center gap-2">
					<ExclamationTriangleIcon
						className={`w-5 h-5 ${config.iconColor}`}
					/>
					<span className={`font-medium ${config.textColor}`}>
						{event.status === "REGISTRATION_CLOSED" && "报名已关闭"}
						{event.status === "DRAFT" &&
							t(`eventStatus.${event.status.toLowerCase()}`)}
						{event.status === "ONGOING" && "活动进行中"}
						{event.status === "COMPLETED" && "活动已结束"}
						{event.status === "CANCELLED" && "活动已取消"}
					</span>
					{event.status === "DRAFT" && (
						<Button size="sm" className="ml-auto">
							{t("eventStatus.publishEvent")}
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
