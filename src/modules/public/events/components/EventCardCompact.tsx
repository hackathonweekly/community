"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LocaleLink } from "@i18n/routing";
import { format } from "date-fns";
import { enUS, zhCN } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";

interface EventCardCompactProps {
	event: {
		id: string;
		title: string;
		description: string;
		type: string;
		status: string;
		startTime: string;
		endTime: string;
		isOnline: boolean;
		address?: string;
		isExternalEvent: boolean;
		externalUrl?: string;
		coverImage?: string;
		photos?: Array<{
			id: string;
			imageUrl: string;
			caption?: string;
		}>;
		tags: string[];
		featured: boolean;
		viewCount: number;
		createdAt: string;
		organizer: {
			id: string;
			name: string;
			image?: string;
			username?: string;
		};
		organization?: {
			id: string;
			name: string;
			slug: string;
			logo?: string;
		};
		_count: {
			registrations: number;
		};
	};
}

function getEventTypeLabel(value: string, t: (key: string) => string) {
	const typeLabels: Record<string, string> = {
		MEETUP: t("events.types.meetup"),
		HACKATHON: t("events.types.hackathon"),
		BUILDING_PUBLIC: t("events.types.buildingPublic"),
	};
	return typeLabels[value] || value;
}

export function EventCardCompact({ event }: EventCardCompactProps) {
	const t = useTranslations();
	const locale = useLocale();

	const formatEventDate = (dateString: string) => {
		const date = new Date(dateString);
		const dateLocale = locale === "zh" ? zhCN : enUS;

		if (locale === "zh") {
			return format(date, "M月d日 H:mm", { locale: dateLocale });
		}
		return format(date, "MMM d 'at' h:mm a", {
			locale: dateLocale,
		});
	};

	const formatVenue = () => {
		if (event.isOnline) {
			return t("events.onlineEvent");
		}
		return event.address || t("events.addressTBD");
	};

	const getEventIcon = () => {
		switch (event.type) {
			case "HACKATHON":
				return "🚀";
			case "MEETUP":
				return "🤝";
			case "BUILDING_PUBLIC":
				return "🏗️";
			default:
				return "📅";
		}
	};

	return (
		<Card className="group overflow-hidden border hover:shadow-lg transition-all duration-300 cursor-pointer bg-white py-2 w-full max-w-full">
			<LocaleLink href={`/events/${event.id}`} className="block">
				<div className="flex gap-3 p-3 items-start">
					{/* 左侧图片区域 - 在移动端使用更小的宽度 */}
					<div className="relative flex-shrink-0">
						<div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden">
							{event.coverImage ||
							(event.photos && event.photos.length > 0) ? (
								<>
									{event.coverImage ? (
										<img
											src={event.coverImage}
											alt={event.title}
											className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
										/>
									) : event.photos &&
										event.photos.length > 0 ? (
										<img
											src={event.photos[0].imageUrl}
											alt={
												event.photos[0].caption ||
												event.title
											}
											className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
										/>
									) : null}
								</>
							) : (
								<div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
									<div className="text-white text-2xl">
										{getEventIcon()}
									</div>
								</div>
							)}
						</div>

						{/* 特色标签 */}
						{event.featured && (
							<Badge className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-500 text-white text-[10px] px-1 py-0 font-semibold rounded-full shadow-md border border-white leading-none h-4 w-4 flex items-center justify-center">
								🔥
							</Badge>
						)}
					</div>

					{/* 右侧内容区域 - 确保不溢出 */}
					<div className="flex-1 min-w-0 space-y-1.5">
						{/* 标题 - 优化字体大小和截断 */}
						<h3 className="font-bold text-gray-900 text-sm sm:text-[15px] leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
							{event.title}
						</h3>

						{/* 标签行 - 优化徽章大小和布局 */}
						<div className="flex items-center gap-1 flex-wrap">
							<Badge className="text-xs px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium border-0 whitespace-nowrap">
								{getEventTypeLabel(event.type, t)}
							</Badge>

							<Badge
								className={`text-xs px-1.5 py-0.5 rounded-md font-medium border-0 whitespace-nowrap ${event.isOnline ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
							>
								{event.isOnline
									? `🌐 ${t("events.filters.online")}`
									: `📍 ${t("events.filters.inPerson")}`}
							</Badge>

							{event.isExternalEvent && (
								<Badge className="text-xs px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700 font-medium border-0 whitespace-nowrap">
									🔗 {t("events.external")}
								</Badge>
							)}
						</div>

						{/* 时间和地点 - 优化布局和截断 */}
						<div className="space-y-1">
							<div className="flex items-center gap-1.5 text-xs text-gray-700">
								<svg
									className="w-3.5 h-3.5 text-orange-500 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
								<span className="font-medium truncate">
									{formatEventDate(event.startTime)}
								</span>
							</div>

							<div className="flex items-center gap-1.5 text-xs text-gray-600">
								<svg
									className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
									/>
								</svg>
								<span className="truncate">
									{formatVenue()}
								</span>
							</div>
						</div>

						{/* 底部信息：组织 + 参与人数 - 优化布局 */}
						<div className="flex items-center justify-between gap-2 pt-1.5 border-t border-gray-100 flex-wrap">
							{event.organization ? (
								<div className="flex items-center gap-1.5 min-w-0 flex-1">
									{event.organization.logo && (
										<img
											src={event.organization.logo}
											alt={event.organization.name}
											className="w-4 h-4 rounded-full object-cover flex-shrink-0"
										/>
									)}
									<span className="text-xs text-gray-600 truncate">
										{event.organization.name}
									</span>
								</div>
							) : (
								<div className="flex-1" />
							)}

							<div className="flex items-center gap-1 text-xs text-gray-500 font-medium flex-shrink-0">
								<svg
									className="w-3.5 h-3.5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
									/>
								</svg>
								<span>{event._count.registrations}</span>
							</div>
						</div>
					</div>
				</div>
			</LocaleLink>
		</Card>
	);
}
