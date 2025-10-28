"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
	CalendarIcon,
	ClockIcon,
	EyeIcon,
	UsersIcon,
	ChatBubbleLeftIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
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

	return (
		<Card className="mb-3 md:mb-6">
			<CardContent className="p-2 md:p-4">
				<div className="flex items-center justify-between text-sm">
					<div className="flex items-center gap-1">
						<UsersIcon className="w-4 h-4 text-blue-600" />
						<span className="font-medium">{confirmedCount}</span>
						<span className="text-muted-foreground">
							{t("stats.confirmed")}
						</span>
					</div>
					<div className="flex items-center gap-1">
						<ClockIcon className="w-4 h-4 text-yellow-600" />
						<span className="font-medium">{pendingCount}</span>
						<span className="text-muted-foreground">
							{t("stats.pending")}
						</span>
					</div>
					<div className="flex items-center gap-1">
						<ChatBubbleLeftIcon className="w-4 h-4 text-purple-600" />
						<span className="font-medium">
							{event._count?.feedbacks || 0}
						</span>
						<span className="text-muted-foreground">反馈</span>
					</div>
					<div className="flex items-center gap-1">
						<EyeIcon className="w-4 h-4 text-green-600" />
						<span className="font-medium">{event.viewCount}</span>
						<span className="text-muted-foreground">
							{t("stats.views")}
						</span>
					</div>
					<div className="flex items-center gap-1">
						<CalendarIcon className="w-4 h-4 text-orange-600" />
						<span className="font-medium">
							{format(new Date(event.startTime), "MMM d")}
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
