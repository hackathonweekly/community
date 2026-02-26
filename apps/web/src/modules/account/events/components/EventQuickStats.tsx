"use client";
import {
	ClockIcon,
	EyeIcon,
	UsersIcon,
	ChatBubbleLeftIcon,
} from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

interface EventQuickStatsProps {
	event: {
		viewCount: number;
		startTime: string;
		_count: {
			feedbacks?: number;
		};
	};
	confirmedCount: number;
	pendingCount: number;
}

export function EventQuickStats({
	event,
	confirmedCount,
	pendingCount,
}: EventQuickStatsProps) {
	const t = useTranslations("events.manage");

	const stats = [
		{
			icon: UsersIcon,
			color: "text-blue-600",
			value: confirmedCount,
			label: t("stats.confirmed"),
		},
		{
			icon: ClockIcon,
			color: "text-yellow-600",
			value: pendingCount,
			label: t("stats.pending"),
		},
		{
			icon: EyeIcon,
			color: "text-green-600",
			value: event.viewCount,
			label: t("stats.views"),
		},
		{
			icon: ChatBubbleLeftIcon,
			color: "text-purple-600",
			value: event._count?.feedbacks || 0,
			label: t("stats.feedback"),
		},
	];

	return (
		<div className="mb-3 lg:mb-6 rounded-lg bg-muted/50 py-3 lg:border lg:bg-transparent lg:shadow-sm lg:p-4">
			<div className="grid grid-cols-4 gap-1 lg:gap-4">
				{stats.map((stat) => (
					<div
						key={stat.label}
						className="flex flex-col items-center gap-0.5 py-1 min-w-0"
					>
						<stat.icon
							className={`w-4 h-4 shrink-0 ${stat.color}`}
						/>
						<span className="text-sm font-semibold">
							{stat.value}
						</span>
						<span className="text-muted-foreground text-[10px] lg:text-xs leading-tight truncate w-full text-center">
							{stat.label}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
