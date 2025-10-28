"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/UserAvatar";
import {
	CalendarIcon,
	EyeIcon,
	GlobeAltIcon,
	MapPinIcon,
	UsersIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Event {
	id: string;
	title: string;
	description: string;
	shortDescription?: string | null;
	type: string;
	status: string;
	startTime: string;
	endTime: string;
	isOnline: boolean;
	address?: string;
	tags: string[];
	featured: boolean;
	viewCount: number;
	organizer: {
		id: string;
		name: string;
		image?: string;
		username?: string;
	};
	_count: {
		registrations: number;
	};
}

interface OrganizationEventsProps {
	organizationId: string;
	organizationSlug: string;
}

const eventStatusColors: Record<string, string> = {
	PUBLISHED: "bg-green-100 text-green-800",
	REGISTRATION_CLOSED: "bg-yellow-100 text-yellow-800",
	ONGOING: "bg-blue-100 text-blue-800",
	COMPLETED: "bg-gray-100 text-gray-800",
	CANCELLED: "bg-red-100 text-red-800",
};

function getEventTypeLabel(value: string, t: any) {
	const typeLabels: Record<string, string> = {
		MEETUP: t("events.types.meetup"),
		HACKATHON: t("events.types.hackathon"),
		BUILDING_PUBLIC: t("events.types.buildingPublic"),
	};
	return typeLabels[value] || value;
}

function getEventStatusLabel(status: string, t: any) {
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

export function OrganizationEvents({
	organizationId,
	organizationSlug,
}: OrganizationEventsProps) {
	const [events, setEvents] = useState<Event[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [showExpired, setShowExpired] = useState(false);
	const t = useTranslations();
	const locale = useLocale();

	const limit = 6; // 每页显示6个活动

	useEffect(() => {
		fetchEvents();
	}, [currentPage, showExpired, organizationId]);

	const fetchEvents = async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams({
				organizationId,
				page: currentPage.toString(),
				limit: limit.toString(),
				status: "PUBLISHED",
			});

			if (showExpired) {
				params.append("showExpired", "true");
			}

			const response = await fetch(`/api/events?${params.toString()}`);
			if (response.ok) {
				const data = await response.json();
				setEvents(data.data.events || []);
				setTotalPages(Math.ceil((data.data.total || 0) / limit));
			}
		} catch (error) {
			console.error("Error fetching organization events:", error);
		} finally {
			setLoading(false);
		}
	};

	const toggleExpiredEvents = () => {
		setShowExpired(!showExpired);
		setCurrentPage(1); // 重置到第一页
	};

	if (loading && currentPage === 1) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{t("public.organizationEvents")}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className="animate-pulse">
								<div className="flex gap-4">
									<div className="w-16 h-16 bg-muted rounded-lg" />
									<div className="flex-1 space-y-2">
										<div className="h-4 bg-muted rounded w-3/4" />
										<div className="h-3 bg-muted rounded w-1/2" />
										<div className="h-3 bg-muted rounded w-1/4" />
									</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!loading && events.length === 0 && currentPage === 1 && !showExpired) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{t("public.organizationEvents")}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-8 text-muted-foreground">
						<CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
						<p className="mb-4">暂无即将到来的活动</p>
						<Button variant="outline" onClick={toggleExpiredEvents}>
							查看所有活动（包括已过期）
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>{t("public.organizationEvents")}</CardTitle>
					<div className="flex gap-2">
						<Button
							variant={showExpired ? "default" : "outline"}
							size="sm"
							onClick={toggleExpiredEvents}
						>
							{showExpired ? "仅显示未来活动" : "显示所有活动"}
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{loading ? (
					<div className="space-y-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className="animate-pulse">
								<div className="flex gap-4">
									<div className="w-16 h-16 bg-muted rounded-lg" />
									<div className="flex-1 space-y-2">
										<div className="h-4 bg-muted rounded w-3/4" />
										<div className="h-3 bg-muted rounded w-1/2" />
										<div className="h-3 bg-muted rounded w-1/4" />
									</div>
								</div>
							</div>
						))}
					</div>
				) : events.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						<CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
						<p>没有找到活动</p>
					</div>
				) : (
					<div className="space-y-4">
						{events.map((event) => (
							<Link
								key={event.id}
								href={`/events/${event.id}`}
								className="block w-full"
							>
								<div
									className="flex flex-col sm:flex-row gap-4 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer w-full max-w-full min-w-0"
									style={{
										width: "100%",
										boxSizing: "border-box",
									}}
								>
									{/* Event Image Placeholder */}
									<div className="w-full sm:w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/40 rounded-lg flex items-center justify-center flex-shrink-0">
										<CalendarIcon className="h-8 w-8 text-primary" />
									</div>

									{/* Event Content */}
									<div className="flex-1 min-w-0">
										{/* Title and badges */}
										<div className="flex flex-col sm:flex-row items-start sm:items-start justify-between mb-2 gap-2">
											<div className="flex-1 min-w-0">
												<h4 className="font-semibold text-sm sm:text-base truncate mb-1">
													{event.title}
												</h4>
												<div className="flex flex-wrap items-center gap-1.5 mb-2">
													{event.featured && (
														<Badge className="bg-yellow-500 text-white text-xs px-1.5 py-0.5 whitespace-nowrap">
															⭐{" "}
															{t(
																"events.card.featured",
															)}
														</Badge>
													)}
													<Badge
														variant="secondary"
														className="text-xs px-1.5 py-0.5 whitespace-nowrap"
													>
														{getEventTypeLabel(
															event.type,
															t,
														)}
													</Badge>
													<Badge
														className={`text-xs px-1.5 py-0.5 whitespace-nowrap ${eventStatusColors[event.status] || "bg-gray-100 text-gray-800"}`}
													>
														{getEventStatusLabel(
															event.status,
															t,
														)}
													</Badge>
												</div>
											</div>
										</div>

										{/* Description */}
										<p className="text-sm text-muted-foreground line-clamp-1 mb-2 truncate">
											{event.shortDescription}
										</p>

										{/* Event details */}
										<div className="grid grid-cols-1 gap-2 text-xs sm:text-sm">
											<div className="flex items-center gap-2 flex-wrap">
												<CalendarIcon className="w-4 h-4 text-primary flex-shrink-0" />
												<span className="truncate">
													{format(
														new Date(
															event.startTime,
														),
														locale === "zh"
															? "yyyy年MM月dd日 HH:mm"
															: "MMM d, yyyy h:mm a",
													)}
												</span>
											</div>
											<div className="flex items-center gap-2">
												{event.isOnline ? (
													<>
														<GlobeAltIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
														<span className="text-blue-700 text-xs sm:text-sm">
															线上活动
														</span>
													</>
												) : (
													<>
														<MapPinIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
														<span className="truncate">
															{event.address ||
																"地点待定"}
														</span>
													</>
												)}
											</div>
										</div>

										{/* Stats */}
										<div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
											<div className="flex items-center gap-1">
												<UsersIcon className="w-3 h-3" />
												<span>
													{event._count.registrations}{" "}
													人报名
												</span>
											</div>
											<div className="flex items-center gap-1">
												<EyeIcon className="w-3 h-3" />
												<span>
													{event.viewCount} 次浏览
												</span>
											</div>
											<div className="flex items-center gap-1">
												<UserAvatar
													name={event.organizer.name}
													avatarUrl={
														event.organizer.image
													}
													className="h-4 w-4"
												/>
												<span className="truncate">
													{event.organizer.name}
												</span>
											</div>
										</div>
									</div>
								</div>
							</Link>
						))}
					</div>
				)}

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="flex justify-center gap-2 mt-6 pt-4 border-t">
						<Button
							variant="outline"
							size="sm"
							disabled={currentPage === 1}
							onClick={() => setCurrentPage(currentPage - 1)}
						>
							上一页
						</Button>
						<span className="flex items-center px-3 text-sm text-muted-foreground">
							第 {currentPage} 页，共 {totalPages} 页
						</span>
						<Button
							variant="outline"
							size="sm"
							disabled={currentPage === totalPages}
							onClick={() => setCurrentPage(currentPage + 1)}
						>
							下一页
						</Button>
					</div>
				)}

				{/* View all events link */}
				{/* <div className="text-center mt-4 pt-4 border-t">
					<Link href={`/events?organization=${organizationSlug}`}>
						<Button variant="outline" size="sm">
							查看该组织的所有活动 →
						</Button>
					</Link>
				</div> */}
			</CardContent>
		</Card>
	);
}
