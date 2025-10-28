"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { enUS, zhCN } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { LocaleLink } from "@i18n/routing";

interface EventCardProps {
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

const eventStatusColors: Record<string, string> = {
	PUBLISHED: "bg-green-100 text-green-800",
	REGISTRATION_CLOSED: "bg-yellow-100 text-yellow-800",
	ONGOING: "bg-blue-100 text-blue-800",
	COMPLETED: "bg-gray-100 text-gray-800",
	CANCELLED: "bg-red-100 text-red-800",
};

function getEventTypeLabel(value: string, t: (key: string) => string) {
	const typeLabels: Record<string, string> = {
		MEETUP: t("events.types.meetup"),
		HACKATHON: t("events.types.hackathon"),
		BUILDING_PUBLIC: t("events.types.buildingPublic"),
	};
	return typeLabels[value] || value;
}

function getEventStatusLabel(status: string, t: (key: string) => string) {
	const statusLabels: Record<string, string> = {
		PUBLISHED: t("events.status.published"),
		DRAFT: t("events.status.draft"),
		CANCELLED: t("events.status.cancelled"),
		COMPLETED: t("events.status.completed"),
		ONGOING: t("events.status.ongoing"),
		REGISTRATION_CLOSED: t("events.status.registrationClosed"),
	};
	return statusLabels[status] || status.replace("_", " ").toLowerCase();
}

export function EventCard({ event }: EventCardProps) {
	const t = useTranslations();
	const locale = useLocale();

	const formatEventDate = (dateString: string) => {
		const date = new Date(dateString);
		const dateLocale = locale === "zh" ? zhCN : enUS;

		if (locale === "zh") {
			return format(date, "M月d日E H:mm", { locale: dateLocale });
		}
		return format(date, "MMM d, yyyy 'at' h:mm a", {
			locale: dateLocale,
		});
	};

	const formatVenue = () => {
		if (event.isOnline) {
			return t("events.onlineEvent");
		}
		return event.address || t("events.addressTBD");
	};

	return (
		<Card
			className="group overflow-hidden border-0 shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer bg-white rounded-2xl w-full max-w-full"
			tabIndex={0}
			role="article"
			aria-label={`${event.title} - ${getEventTypeLabel(event.type, t)}`}
		>
			<LocaleLink href={`/events/${event.id}`} className="block">
				<div className="relative">
					{/* 头部图片区域 - 移动端使用更小的高度 */}
					<div className="relative h-40 sm:h-48 overflow-hidden">
						{event.coverImage ||
						(event.photos && event.photos.length > 0) ? (
							<>
								{event.coverImage ? (
									<img
										src={event.coverImage}
										alt={event.title}
										className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
									/>
								) : event.photos && event.photos.length > 0 ? (
									<img
										src={event.photos[0].imageUrl}
										alt={
											event.photos[0].caption ||
											event.title
										}
										className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
									/>
								) : null}
							</>
						) : (
							<div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
								<div className="text-white text-4xl">
									{event.type === "HACKATHON"
										? "🚀"
										: event.type === "MEETUP"
											? "🤝"
											: event.type === "BUILDING_PUBLIC"
												? "🏗️"
												: "📅"}
								</div>
							</div>
						)}

						{/* 渐变遮罩 */}
						<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

						{/* 顶部标签区域 - 优化徽章大小和间距 */}
						<div className="absolute top-3 left-3 right-3 flex justify-between items-start gap-2 flex-wrap">
							{/* 左侧：特色 + 类型 */}
							<div className="flex items-center gap-1.5">
								{event.featured && (
									<Badge className="bg-red-500/90 hover:bg-red-500 text-white text-xs px-2 py-0.75 font-semibold rounded-full backdrop-blur-sm border border-white/20 whitespace-nowrap">
										🔥 {t("events.featured")}
									</Badge>
								)}
								<Badge
									variant="secondary"
									className="bg-white/90 hover:bg-white text-gray-700 text-xs px-2 py-0.75 font-medium rounded-full backdrop-blur-sm whitespace-nowrap"
								>
									{getEventTypeLabel(event.type, t)}
								</Badge>
							</div>

							{/* 右侧：状态标签 */}
							{event.status !== "PUBLISHED" && (
								<Badge
									className={`text-xs px-2 py-0.75 rounded-full font-medium backdrop-blur-sm ${eventStatusColors[event.status] || "bg-gray-100 text-gray-800"}`}
								>
									{getEventStatusLabel(event.status, t)}
								</Badge>
							)}
						</div>

						{/* 底部信息 - 覆盖在图片上 - 优化徽章大小 */}
						<div className="absolute bottom-3 left-3 right-3">
							<div className="flex items-center gap-1.5 flex-wrap">
								{/* 在线/线下标签 */}
								<Badge
									className={`text-xs px-2 py-0.75 rounded-full font-medium backdrop-blur-sm border border-white/20 whitespace-nowrap ${event.isOnline ? "bg-blue-500/80 text-white" : "bg-green-500/80 text-white"}`}
								>
									{event.isOnline
										? `🌐 ${t("events.filters.online")}`
										: `📍 ${t("events.filters.inPerson")}`}
								</Badge>

								{/* 外部活动标签 */}
								{event.isExternalEvent && (
									<Badge className="bg-orange-500/80 text-white text-xs px-2 py-0.75 rounded-full font-medium backdrop-blur-sm border border-white/20 whitespace-nowrap">
										🔗 {t("events.external")}
									</Badge>
								)}
							</div>
						</div>
					</div>

					{/* 内容区域 */}
					<div className="p-4 sm:p-5 space-y-3">
						{/* 标题 - 优化字体大小和截断 */}
						<h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors duration-300 min-h-[2.5rem]">
							{event.title}
						</h3>

						{/* 时间信息 - 优化布局 */}
						<div className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
							<div className="flex items-center gap-1.5 text-orange-500 font-semibold">
								<svg
									className="w-4 h-4 flex-shrink-0"
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
								<span className="truncate">
									{formatEventDate(event.startTime)}
								</span>
							</div>
						</div>

						{/* 地点信息 - 优化字体大小 */}
						<div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600">
							<svg
								className="w-4 h-4 text-gray-400 flex-shrink-0"
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
							<span className="truncate">{formatVenue()}</span>
						</div>

						{/* 底部信息 - 优化布局 */}
						<div className="flex items-center justify-between pt-3 border-t border-gray-100 flex-wrap gap-2">
							{/* 左侧：组织信息 */}
							{event.organization && (
								<div className="flex items-center gap-2 min-w-0 flex-1">
									{event.organization.logo && (
										<img
											src={event.organization.logo}
											alt={event.organization.name}
											className="w-5 h-5 rounded-full object-cover flex-shrink-0"
										/>
									)}
									<span className="text-xs sm:text-sm text-gray-600 truncate">
										{event.organization.name}
									</span>
								</div>
							)}

							{/* 右侧：参与人数 */}
							<div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 font-medium flex-shrink-0 ml-2">
								<svg
									className="w-4 h-4"
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
