import { CalendarIcon } from "@heroicons/react/24/outline";
import { getTranslations } from "next-intl/server";
import { EventCard } from "./EventCard";
import { EventCardCompact } from "./EventCardCompact";
import { Button } from "@/components/ui/button";

interface EventsServerListProps {
	events: any[];
}

export async function EventsServerList({ events }: EventsServerListProps) {
	const t = await getTranslations();

	if (events.length === 0) {
		return (
			<div className="text-center py-16 px-4">
				<CalendarIcon
					className="w-20 h-20 mx-auto text-gray-300 mb-5"
					aria-hidden="true"
				/>
				<div className="text-gray-900 text-xl mb-3 font-semibold">
					{t("events.emptyState.title")}
				</div>
				<p className="text-gray-500 mb-8 text-base max-w-md mx-auto">
					{t("events.emptyState.noEventsYet")}
				</p>
				<Button
					variant="outline"
					className="rounded-xl h-11 px-6"
					asChild
				>
					<a href="/events">{t("events.filters.clearFilters")}</a>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-5 md:space-y-6">
			{/* 响应式布局：移动端使用紧凑卡片，桌面端使用网格卡片 */}
			<div className="space-y-3 md:hidden">
				{events.map((event: any) => (
					<EventCardCompact key={event.id} event={event} />
				))}
			</div>

			<div className="hidden md:grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
				{events.map((event: any) => (
					<EventCard key={event.id} event={event} />
				))}
			</div>

			{/* 加载更多按钮 - 如果需要分页 */}
			{events.length >= 20 && (
				<div className="text-center pt-8">
					<Button variant="outline" className="rounded-xl h-11 px-8">
						{t("common.loadMore")}
					</Button>
				</div>
			)}
		</div>
	);
}
