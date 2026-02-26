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
		<div className="mb-4 rounded-xl border bg-card/70 p-2 shadow-sm lg:mb-6 lg:p-3">
			<div className="grid grid-cols-4 gap-1.5 lg:gap-3">
				{stats.map((stat) => (
					<div
						key={stat.label}
						className="flex min-w-0 flex-col items-center gap-1 rounded-lg bg-background/70 px-1.5 py-2 text-center"
					>
						<stat.icon
							className={`h-4 w-4 shrink-0 ${stat.color}`}
						/>
						<span className="text-sm font-semibold lg:text-base">
							{stat.value}
						</span>
						<span className="w-full truncate text-[11px] leading-tight text-muted-foreground lg:text-xs">
							{stat.label}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
